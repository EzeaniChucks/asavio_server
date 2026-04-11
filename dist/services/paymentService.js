"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = exports.PaymentService = void 0;
// src/services/paymentService.ts
const https = __importStar(require("https"));
const crypto = __importStar(require("crypto"));
const database_1 = require("../config/database");
const Booking_1 = require("../entities/Booking");
const AppError_1 = require("../utils/AppError");
const emailService_1 = require("./emailService");
const notificationService_1 = require("./notificationService");
const subscriptionService_1 = require("./subscriptionService");
function paystackRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : undefined;
        const options = {
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
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error("Invalid JSON from Paystack"));
                }
            });
        });
        req.on("error", reject);
        if (payload)
            req.write(payload);
        req.end();
    });
}
class PaymentService {
    get bookingRepo() {
        return database_1.AppDataSource.getRepository(Booking_1.Booking);
    }
    async initializePayment(bookingId, userId) {
        const booking = await this.bookingRepo.findOne({
            where: { id: bookingId, userId },
            relations: ["user", "property"],
        });
        if (!booking)
            throw new AppError_1.AppError("Booking not found", 404);
        if (booking.paymentStatus === "paid") {
            throw new AppError_1.AppError("This booking has already been paid for", 400);
        }
        // Paystack amounts are in the smallest currency unit (kobo for NGN)
        const amountInKobo = Math.round(Number(booking.totalPrice) * 100);
        const response = await paystackRequest("POST", "/transaction/initialize", {
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
        });
        if (!response.status) {
            throw new AppError_1.AppError(`Payment initialization failed: ${response.message}`, 502);
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
    async verifyPayment(reference) {
        const response = await paystackRequest("GET", `/transaction/verify/${encodeURIComponent(reference)}`);
        if (!response.status) {
            throw new AppError_1.AppError("Could not verify payment with Paystack", 502);
        }
        const booking = await this.bookingRepo.findOne({
            where: { paystackReference: reference },
            relations: ["user", "property"],
        });
        if (!booking)
            throw new AppError_1.AppError("Booking not found for this reference", 404);
        if (response.data.status === "success") {
            // Only reinstate to confirmed if the booking hasn't been deliberately cancelled
            // after already being paid (e.g. admin issued a refund then cancelled).
            // A cancelled booking with paymentStatus still "pending" means it was cancelled
            // before we knew the payment outcome — safe to reinstate.
            const shouldReinstate = booking.status !== "cancelled" || booking.paymentStatus !== "paid";
            const newStatus = shouldReinstate ? "confirmed" : booking.status;
            await this.bookingRepo.update(booking.id, {
                paymentStatus: "paid",
                status: newStatus,
            });
            booking.paymentStatus = "paid";
            booking.status = newStatus;
            // Send confirmation email (deferred from booking creation)
            const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                (1000 * 60 * 60 * 24));
            emailService_1.emailService
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
            notificationService_1.notificationService.send({
                userId: booking.user.id,
                type: "booking_confirmed",
                title: "Booking confirmed ✓",
                body: `Payment received. Your booking for "${booking.property?.title ?? "your property"}" is confirmed.`,
                data: { url: `/bookings/${booking.id}`, urlLabel: "View booking" },
            }).catch(console.error);
            // In-app to host
            if (booking.property?.hostId) {
                notificationService_1.notificationService.send({
                    userId: booking.property.hostId,
                    type: "booking_confirmed",
                    title: "Booking payment received",
                    body: `Payment confirmed for a booking at "${booking.property.title}". Check your dashboard.`,
                    data: { url: `/dashboard/host`, urlLabel: "View bookings" },
                }).catch(console.error);
            }
        }
        else if (response.data.status === "failed") {
            await this.bookingRepo.update(booking.id, { paymentStatus: "failed" });
            booking.paymentStatus = "failed";
        }
        return booking;
    }
    /**
     * Issues a Paystack refund for the given reference.
     * @param paystackReference  The original transaction reference stored on the booking
     * @param amountNGN          Amount to refund in NGN (converted to kobo internally). Omit for full refund.
     */
    async refundTransaction(paystackReference, amountNGN) {
        const amountInKobo = Math.round(amountNGN * 100);
        const response = await paystackRequest("POST", "/refund", {
            transaction: paystackReference,
            amount: amountInKobo,
            merchant_note: "Booking cancellation refund — Asavio",
            customer_note: "Your booking has been cancelled and a refund has been processed.",
        });
        if (!response.status) {
            throw new AppError_1.AppError(`Paystack refund failed: ${response.message}`, 502);
        }
    }
    async handleWebhook(rawBody, signature) {
        const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
        const hash = crypto
            .createHmac("sha512", secret)
            .update(rawBody)
            .digest("hex");
        console.log("[Webhook] HMAC computed:", hash.slice(0, 16) + "...");
        if (hash !== signature) {
            console.error("[Webhook] Signature mismatch — possible tampered payload or wrong secret key");
            throw new AppError_1.AppError("Invalid webhook signature", 400);
        }
        console.log("[Webhook] Signature verified OK");
        const event = JSON.parse(rawBody.toString());
        console.log("[Webhook] Event type:", event.event);
        // ── charge.success ────────────────────────────────────────────────────
        if (event.event === "charge.success") {
            const meta = event.data.metadata;
            console.log("[Webhook] charge.success — metadata:", JSON.stringify(meta));
            // Initial subscription charge — metadata contains type:"subscription_initiate"
            if (meta?.type === "subscription_initiate") {
                console.log("[Webhook] Initial subscription charge — activating");
                const hostId = meta.hostId;
                const tier = meta.subscriptionTier;
                const cycle = meta.billingCycle;
                const planCode = meta.planCode;
                // Paystack embeds subscription data inside charge.success when a plan is used
                const subData = event.data.subscription ?? {};
                await subscriptionService_1.subscriptionService
                    .activateSubscription({ hostId, tier, cycle, planCode, subscriptionData: subData })
                    .catch((err) => console.error("[Webhook] activateSubscription failed:", err));
                console.log("[Webhook] activateSubscription completed");
                return;
            }
            // Recurring subscription renewal — Paystack-initiated charge has event.data.plan set
            // but no custom metadata (we never set metadata on Paystack's own recurring charges)
            if (event.data.plan) {
                const subCode = event.data.subscription?.subscription_code;
                const nextPayDate = event.data.subscription?.next_payment_date;
                console.log("[Webhook] Recurring subscription charge — subCode:", subCode, "nextPayment:", nextPayDate);
                if (subCode) {
                    await subscriptionService_1.subscriptionService
                        .renewSubscription(subCode, nextPayDate ?? "")
                        .catch((err) => console.error("[Webhook] renewSubscription failed:", err));
                    console.log("[Webhook] renewSubscription completed for", subCode);
                }
                else {
                    console.warn("[Webhook] Recurring charge with plan but no subscription_code — ignoring");
                }
                return;
            }
            // Regular booking charge
            const { reference } = event.data;
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
            const webhookNights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                (1000 * 60 * 60 * 24));
            console.log("[Webhook] Sending confirmation email to", booking.user.email);
            emailService_1.emailService
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
            notificationService_1.notificationService.send({
                userId: booking.user.id,
                type: "booking_confirmed",
                title: "Booking confirmed ✓",
                body: `Payment received. Your booking for "${booking.property?.title ?? "your property"}" is confirmed.`,
                data: { url: `/bookings/${booking.id}`, urlLabel: "View booking" },
            }).catch((err) => console.error("[Webhook] Guest notification failed:", err));
            if (booking.property?.hostId) {
                console.log("[Webhook] Sending in-app notification to host", booking.property.hostId);
                notificationService_1.notificationService.send({
                    userId: booking.property.hostId,
                    type: "booking_confirmed",
                    title: "Booking payment received",
                    body: `Payment confirmed for a booking at "${booking.property.title}". Check your dashboard.`,
                    data: { url: `/dashboard/host`, urlLabel: "View bookings" },
                }).catch((err) => console.error("[Webhook] Host notification failed:", err));
            }
        }
        // ── subscription.create — fired by Paystack when a subscription is created ──
        // Use this as the authoritative source of subscription_code and email_token.
        // It fires alongside charge.success on initial payment; we upsert the codes here.
        if (event.event === "subscription.create") {
            const subCode = event.data?.subscription_code;
            const emailToken = event.data?.email_token;
            console.log("[Webhook] subscription.create — subCode:", subCode);
            if (subCode) {
                await subscriptionService_1.subscriptionService
                    .storeSubscriptionCodes(subCode, emailToken ?? null, event.data?.customer?.customer_code ?? null)
                    .catch((err) => console.error("[Webhook] storeSubscriptionCodes failed:", err));
            }
        }
        // ── invoice.payment_failed — recurring charge failed ──────────────────
        if (event.event === "invoice.payment_failed") {
            const subCode = event.data?.subscription?.subscription_code;
            console.log("[Webhook] invoice.payment_failed — subCode:", subCode);
            if (subCode) {
                await subscriptionService_1.subscriptionService.markPastDue(subCode).catch((err) => console.error("[Webhook] markPastDue failed:", err));
            }
            else {
                console.warn("[Webhook] invoice.payment_failed — no subscription_code in payload");
            }
        }
        // ── subscription.not_renew — customer has flagged for non-renewal ─────
        // The subscription is still active until the end of the current period.
        // Do NOT downgrade the user yet — that happens on subscription.disable.
        if (event.event === "subscription.not_renew") {
            const subCode = event.data?.subscription_code;
            console.log("[Webhook] subscription.not_renew — subCode:", subCode);
            if (subCode) {
                await subscriptionService_1.subscriptionService
                    .markCancelledPendingExpiry(subCode)
                    .catch((err) => console.error("[Webhook] markCancelledPendingExpiry failed:", err));
            }
        }
        // ── subscription.disable — subscription has fully ended ───────────────
        // Fires at end of the final billing cycle. Now we downgrade to starter.
        if (event.event === "subscription.disable") {
            const subCode = event.data?.subscription_code;
            console.log("[Webhook] subscription.disable — subCode:", subCode);
            if (subCode) {
                await subscriptionService_1.subscriptionService
                    .expireSubscription(subCode)
                    .catch((err) => console.error("[Webhook] expireSubscription failed:", err));
            }
        }
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=paymentService.js.map