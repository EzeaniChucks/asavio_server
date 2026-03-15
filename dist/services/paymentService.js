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
            callback_url: `${process.env.FRONTEND_URL}/bookings/${booking.id}/payment-success`,
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
            await this.bookingRepo.update(booking.id, {
                paymentStatus: "paid",
                status: "confirmed",
            });
            booking.paymentStatus = "paid";
            booking.status = "confirmed";
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
        }
        else if (response.data.status === "failed") {
            await this.bookingRepo.update(booking.id, { paymentStatus: "failed" });
            booking.paymentStatus = "failed";
        }
        return booking;
    }
    async handleWebhook(rawBody, signature) {
        const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
        const hash = crypto
            .createHmac("sha512", secret)
            .update(rawBody)
            .digest("hex");
        if (hash !== signature) {
            throw new AppError_1.AppError("Invalid webhook signature", 400);
        }
        const event = JSON.parse(rawBody.toString());
        if (event.event === "charge.success") {
            const { reference } = event.data;
            const booking = await this.bookingRepo.findOne({
                where: { paystackReference: reference },
                relations: ["user", "property"],
            });
            if (!booking || booking.paymentStatus === "paid")
                return;
            await this.bookingRepo.update(booking.id, {
                paymentStatus: "paid",
                status: "confirmed",
            });
            const webhookNights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) /
                (1000 * 60 * 60 * 24));
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
                .catch(console.error);
        }
    }
}
exports.PaymentService = PaymentService;
exports.paymentService = new PaymentService();
//# sourceMappingURL=paymentService.js.map