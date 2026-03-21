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
exports.payoutService = exports.PayoutService = void 0;
// src/services/payoutService.ts
const https = __importStar(require("https"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Booking_1 = require("../entities/Booking");
const AppError_1 = require("../utils/AppError");
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
class PayoutService {
    get userRepo() { return database_1.AppDataSource.getRepository(User_1.User); }
    get bookingRepo() { return database_1.AppDataSource.getRepository(Booking_1.Booking); }
    // ── Bank lookup ──────────────────────────────────────────────────────────
    async getBanks() {
        const res = await paystackRequest("GET", "/bank?currency=NGN&country=nigeria&perPage=100");
        if (!res.status)
            throw new AppError_1.AppError("Could not fetch banks from Paystack", 502);
        return res.data;
    }
    async verifyAccount(accountNumber, bankCode) {
        const res = await paystackRequest("GET", `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
        if (!res.status)
            throw new AppError_1.AppError("Could not verify bank account. Check the details and try again.", 400);
        return {
            accountName: res.data.account_name,
            accountNumber: res.data.account_number,
        };
    }
    // ── Host bank details ────────────────────────────────────────────────────
    async saveHostBankDetails(hostId, { accountNumber, bankCode, bankName, }) {
        const host = await this.userRepo.findOne({ where: { id: hostId } });
        if (!host)
            throw new AppError_1.AppError("Host not found", 404);
        // Verify account with Paystack
        const { accountName } = await this.verifyAccount(accountNumber, bankCode);
        // Create / update transfer recipient on Paystack
        const recipientRes = await paystackRequest("POST", "/transferrecipient", {
            type: "nuban",
            name: accountName,
            account_number: accountNumber,
            bank_code: bankCode,
            currency: "NGN",
        });
        if (!recipientRes.status) {
            throw new AppError_1.AppError(`Could not register bank account: ${recipientRes.message}`, 502);
        }
        await this.userRepo.update(hostId, {
            bankAccountNumber: accountNumber,
            bankCode,
            bankAccountName: accountName,
            bankName,
            paystackRecipientCode: recipientRes.data.recipient_code,
        });
        return (await this.userRepo.findOne({ where: { id: hostId } }));
    }
    async getHostBankDetails(hostId) {
        const host = await this.userRepo.findOne({ where: { id: hostId } });
        if (!host)
            throw new AppError_1.AppError("Host not found", 404);
        return {
            bankAccountNumber: host.bankAccountNumber,
            bankAccountName: host.bankAccountName,
            bankCode: host.bankCode,
            bankName: host.bankName,
            hasDetails: !!host.bankAccountNumber && !!host.paystackRecipientCode,
        };
    }
    // ── Payout processing ────────────────────────────────────────────────────
    async getPendingPayouts() {
        // Bookings that are confirmed/completed, payment received, and haven't been paid out yet
        return this.bookingRepo
            .createQueryBuilder("booking")
            .leftJoinAndSelect("booking.property", "property")
            .leftJoinAndSelect("booking.user", "user")
            .where("booking.paymentStatus = :paid", { paid: "paid" })
            .andWhere("booking.hostPayoutStatus = :pending", { pending: "pending" })
            .andWhere("booking.status IN (:...statuses)", { statuses: ["confirmed", "completed"] })
            .orderBy("booking.checkIn", "ASC")
            .getMany();
    }
    async processHostPayout(bookingId) {
        const booking = await this.bookingRepo.findOne({
            where: { id: bookingId },
            relations: ["property", "user"],
        });
        if (!booking)
            throw new AppError_1.AppError("Booking not found", 404);
        if (booking.paymentStatus !== "paid")
            throw new AppError_1.AppError("Payment has not been received for this booking", 400);
        if (booking.hostPayoutStatus === "transferred")
            throw new AppError_1.AppError("Payout already transferred", 400);
        if (booking.hostPayoutStatus === "processing")
            throw new AppError_1.AppError("Payout is already being processed", 400);
        // Fetch host details
        const hostId = booking.property?.hostId ?? booking.vehicle?.hostId;
        if (!hostId)
            throw new AppError_1.AppError("Cannot determine host for this booking", 400);
        const host = await this.userRepo.findOne({ where: { id: hostId } });
        if (!host)
            throw new AppError_1.AppError("Host not found", 404);
        if (!host.paystackRecipientCode) {
            throw new AppError_1.AppError("Host has not set up their bank account for payouts", 400);
        }
        const payoutAmountKobo = Math.round(Number(booking.hostPayout) * 100);
        if (payoutAmountKobo <= 0)
            throw new AppError_1.AppError("Invalid payout amount", 400);
        // Mark as processing first
        await this.bookingRepo.update(bookingId, { hostPayoutStatus: "processing" });
        const transferRes = await paystackRequest("POST", "/transfer", {
            source: "balance",
            amount: payoutAmountKobo,
            recipient: host.paystackRecipientCode,
            reason: `Asavio booking payout — ${bookingId.slice(0, 8).toUpperCase()}`,
        });
        if (!transferRes.status) {
            await this.bookingRepo.update(bookingId, { hostPayoutStatus: "failed" });
            throw new AppError_1.AppError(`Transfer failed: ${transferRes.message}`, 502);
        }
        await this.bookingRepo.update(bookingId, {
            hostPayoutStatus: "transferred",
            payoutReference: transferRes.data.transfer_code,
        });
        return (await this.bookingRepo.findOne({
            where: { id: bookingId },
            relations: ["property", "user"],
        }));
    }
}
exports.PayoutService = PayoutService;
exports.payoutService = new PayoutService();
//# sourceMappingURL=payoutService.js.map