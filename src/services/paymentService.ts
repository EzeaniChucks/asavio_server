// src/services/paymentService.ts
import * as https from "https";
import * as crypto from "crypto";
import { AppDataSource } from "../config/database";
import { Booking } from "../entities/Booking";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";
import { subscriptionService } from "./subscriptionService";
import { SubscriptionTier, BillingCycle } from "../constants/subscriptionTiers";

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number; // in kobo
    currency: string;
    metadata?: Record<string, unknown>;
  };
}

function paystackRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options: https.RequestOptions = {
      hostname: "api.paystack.co",
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data) as T);
        } catch {
          reject(new Error("Invalid JSON from Paystack"));
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

export class PaymentService {
  private get bookingRepo() {
    return AppDataSource.getRepository(Booking);
  }

  async initializePayment(
    bookingId: string,
    userId: string
  ): Promise<{ authorization_url: string; reference: string }> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId, userId },
      relations: ["user", "property"],
    });

    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.paymentStatus === "paid") {
      throw new AppError("This booking has already been paid for", 400);
    }

    // Paystack amounts are in the smallest currency unit (kobo for NGN)
    const amountInKobo = Math.round(Number(booking.totalPrice) * 100);

    const response = await paystackRequest<PaystackInitResponse>(
      "POST",
      "/transaction/initialize",
      {
        email: booking.user.email,
        amount: amountInKobo,
        currency: "NGN",
        reference: `ASAVIO-${booking.id}-${Date.now()}`,
        metadata: {
          bookingId: booking.id,
          userId: booking.userId,
          propertyId: booking.propertyId,
          propertyTitle: booking.property?.title,
        },
        callback_url: `${process.env.APP_URL || (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim()}/bookings/${booking.id}/payment-success`,
      }
    );

    if (!response.status) {
      throw new AppError(`Payment initialization failed: ${response.message}`, 502);
    }

    // Persist the reference so we can verify later
    await this.bookingRepo.update(bookingId, {
      paystackReference: response.data.reference,
      paymentMethod: "paystack",
    });

    return {
      authorization_url: response.data.authorization_url,
      reference: response.data.reference,
    };
  }

  async verifyPayment(reference: string): Promise<Booking> {
    const response = await paystackRequest<PaystackVerifyResponse>(
      "GET",
      `/transaction/verify/${encodeURIComponent(reference)}`
    );

    if (!response.status) {
      throw new AppError("Could not verify payment with Paystack", 502);
    }

    const booking = await this.bookingRepo.findOne({
      where: { paystackReference: reference },
      relations: ["user", "property"],
    });

    if (!booking) throw new AppError("Booking not found for this reference", 404);

    if (response.data.status === "success") {
      await this.bookingRepo.update(booking.id, {
        paymentStatus: "paid",
        status: "confirmed",
      });
      booking.paymentStatus = "paid";
      booking.status = "confirmed";

      // Send confirmation email (deferred from booking creation)
      const nights = Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      emailService
        .sendBookingConfirmation({
          to: booking.user.email,
          firstName: booking.user.firstName,
          propertyTitle: booking.property?.title ?? "your property",
          checkIn: new Date(booking.checkIn).toLocaleDateString("en-GB"),
          checkOut: new Date(booking.checkOut).toLocaleDateString("en-GB"),
          nights,
          totalPrice: Number(booking.totalPrice),
          bookingId: booking.id,
        })
        .catch(console.error);

      // In-app to guest
      notificationService.send({
        userId: booking.user.id,
        type: "booking_confirmed",
        title: "Booking confirmed ✓",
        body: `Payment received. Your booking for "${booking.property?.title ?? "your property"}" is confirmed.`,
        data: { url: `/bookings/${booking.id}`, urlLabel: "View booking" },
      }).catch(console.error);

      // In-app to host
      if (booking.property?.hostId) {
        notificationService.send({
          userId: booking.property.hostId,
          type: "booking_confirmed",
          title: "Booking payment received",
          body: `Payment confirmed for a booking at "${booking.property.title}". Check your dashboard.`,
          data: { url: `/dashboard/host`, urlLabel: "View bookings" },
        }).catch(console.error);
      }
    } else if (response.data.status === "failed") {
      await this.bookingRepo.update(booking.id, { paymentStatus: "failed" });
      booking.paymentStatus = "failed";
    }

    return booking;
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
    const hash = crypto
      .createHmac("sha512", secret)
      .update(rawBody)
      .digest("hex");

    console.log("[Webhook] HMAC computed:", hash.slice(0, 16) + "...");
    if (hash !== signature) {
      console.error("[Webhook] Signature mismatch — possible tampered payload or wrong secret key");
      throw new AppError("Invalid webhook signature", 400);
    }
    console.log("[Webhook] Signature verified OK");

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      data: Record<string, any>;
    };
    console.log("[Webhook] Event type:", event.event);

    // ── Booking payment ────────────────────────────────────────────────────
    if (event.event === "charge.success") {
      const meta = event.data.metadata as Record<string, unknown> | undefined;
      console.log("[Webhook] charge.success — metadata:", JSON.stringify(meta));

      // If metadata has type = 'subscription_initiate' this is the first
      // subscription charge — activate the subscription record.
      if (meta?.type === "subscription_initiate") {
        console.log("[Webhook] Routing to subscriptionService.activateSubscription");
        const hostId = meta.hostId as string;
        const tier = meta.subscriptionTier as SubscriptionTier;
        const cycle = meta.billingCycle as BillingCycle;
        const planCode = meta.planCode as string;
        const subData = event.data.subscription ?? event.data;
        console.log("[Webhook] Subscription activate payload — hostId:", hostId, "tier:", tier, "cycle:", cycle, "planCode:", planCode);
        await subscriptionService
          .activateSubscription({ hostId, tier, cycle, planCode, subscriptionData: subData })
          .catch((err) => console.error("[Webhook] activateSubscription failed:", err));
        console.log("[Webhook] activateSubscription call completed");
        return;
      }

      // Regular booking charge
      const { reference } = event.data as { reference: string };
      console.log("[Webhook] Booking charge — reference:", reference);
      const booking = await this.bookingRepo.findOne({
        where: { paystackReference: reference },
        relations: ["user", "property"],
      });

      if (!booking) {
        console.warn("[Webhook] No booking found for reference:", reference, "— ignoring");
        return;
      }
      if (booking.paymentStatus === "paid") {
        console.log("[Webhook] Booking", booking.id, "already marked paid — skipping (idempotent)");
        return;
      }

      console.log("[Webhook] Marking booking", booking.id, "as paid");
      await this.bookingRepo.update(booking.id, {
        paymentStatus: "paid",
        status: "confirmed",
      });
      console.log("[Webhook] Booking", booking.id, "updated to paid/confirmed");

      const webhookNights = Math.ceil(
        (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      console.log("[Webhook] Sending confirmation email to", booking.user.email);
      emailService
        .sendBookingConfirmation({
          to: booking.user.email,
          firstName: booking.user.firstName,
          propertyTitle: booking.property?.title ?? "your property",
          checkIn: new Date(booking.checkIn).toLocaleDateString("en-GB"),
          checkOut: new Date(booking.checkOut).toLocaleDateString("en-GB"),
          nights: webhookNights,
          totalPrice: Number(booking.totalPrice),
          bookingId: booking.id,
        })
        .catch((err) => console.error("[Webhook] sendBookingConfirmation failed:", err));

      console.log("[Webhook] Sending in-app notification to guest", booking.user.id);
      notificationService.send({
        userId: booking.user.id,
        type: "booking_confirmed",
        title: "Booking confirmed ✓",
        body: `Payment received. Your booking for "${booking.property?.title ?? "your property"}" is confirmed.`,
        data: { url: `/bookings/${booking.id}`, urlLabel: "View booking" },
      }).catch((err) => console.error("[Webhook] Guest notification failed:", err));

      if (booking.property?.hostId) {
        console.log("[Webhook] Sending in-app notification to host", booking.property.hostId);
        notificationService.send({
          userId: booking.property.hostId,
          type: "booking_confirmed",
          title: "Booking payment received",
          body: `Payment confirmed for a booking at "${booking.property.title}". Check your dashboard.`,
          data: { url: `/dashboard/host`, urlLabel: "View bookings" },
        }).catch((err) => console.error("[Webhook] Host notification failed:", err));
      }
    }

    // ── Subscription renewal ───────────────────────────────────────────────
    if (event.event === "invoice.payment_failed") {
      const subCode = event.data?.subscription?.subscription_code as string | undefined;
      console.log("[Webhook] invoice.payment_failed — subCode:", subCode);
      if (subCode) {
        await subscriptionService.markPastDue(subCode).catch((err) => console.error("[Webhook] markPastDue failed:", err));
        console.log("[Webhook] markPastDue called for", subCode);
      } else {
        console.warn("[Webhook] invoice.payment_failed — no subscription_code found in payload");
      }
    }

    // ── Subscription disabled (cancel confirmed by Paystack) ───────────────
    if (event.event === "subscription.disable" || event.event === "subscription.not_renew") {
      const subCode = event.data?.subscription_code as string | undefined;
      console.log("[Webhook]", event.event, "— subCode:", subCode);
      if (subCode) {
        await subscriptionService.expireSubscription(subCode).catch((err) => console.error("[Webhook] expireSubscription failed:", err));
        console.log("[Webhook] expireSubscription called for", subCode);
      } else {
        console.warn("[Webhook]", event.event, "— no subscription_code found in payload");
      }
    }
  }
}

export const paymentService = new PaymentService();
