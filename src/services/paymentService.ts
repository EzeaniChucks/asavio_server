// src/services/paymentService.ts
import * as https from "https";
import * as crypto from "crypto";
import { AppDataSource } from "../config/database";
import { Booking } from "../entities/Booking";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";

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
        callback_url: `${process.env.FRONTEND_URL}/bookings/${booking.id}/payment-success`,
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

  async verifyPayment(reference: string, requestingUserId: string): Promise<Booking> {
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

    if (booking.userId !== requestingUserId) {
      throw new AppError("You are not authorised to verify this payment", 403);
    }

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

    if (hash !== signature) {
      throw new AppError("Invalid webhook signature", 400);
    }

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      data: { reference: string; status: string };
    };

    if (event.event === "charge.success") {
      const { reference } = event.data;
      const booking = await this.bookingRepo.findOne({
        where: { paystackReference: reference },
        relations: ["user", "property"],
      });

      if (!booking || booking.paymentStatus === "paid") return;

      await this.bookingRepo.update(booking.id, {
        paymentStatus: "paid",
        status: "confirmed",
      });

      const webhookNights = Math.ceil(
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
          nights: webhookNights,
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
    }
  }
}

export const paymentService = new PaymentService();
