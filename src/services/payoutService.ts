// src/services/payoutService.ts
import * as https from "https";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Booking } from "../entities/Booking";
import { AppError } from "../utils/AppError";
import { notificationService } from "./notificationService";

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
        try { resolve(JSON.parse(data) as T); }
        catch { reject(new Error("Invalid JSON from Paystack")); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

interface PaystackBank { name: string; code: string; }
interface PaystackBanksResponse { status: boolean; data: PaystackBank[]; }
interface PaystackResolveResponse { status: boolean; data: { account_name: string; account_number: string; }; }
interface PaystackRecipientResponse { status: boolean; message: string; data: { recipient_code: string; }; }
interface PaystackTransferResponse { status: boolean; message: string; data: { transfer_code: string; status: string; }; }

export class PayoutService {
  private get userRepo() { return AppDataSource.getRepository(User); }
  private get bookingRepo() { return AppDataSource.getRepository(Booking); }

  // ── Bank lookup ──────────────────────────────────────────────────────────

  async getBanks(): Promise<PaystackBank[]> {
    const res = await paystackRequest<PaystackBanksResponse>(
      "GET",
      "/bank?currency=NGN&country=nigeria&perPage=100"
    );
    if (!res.status) throw new AppError("Could not fetch banks from Paystack", 502);
    return res.data;
  }

  async verifyAccount(
    accountNumber: string,
    bankCode: string
  ): Promise<{ accountName: string; accountNumber: string }> {
    const res = await paystackRequest<PaystackResolveResponse>(
      "GET",
      `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
    );
    if (!res.status) throw new AppError("Could not verify bank account. Check the details and try again.", 400);
    return {
      accountName: res.data.account_name,
      accountNumber: res.data.account_number,
    };
  }

  // ── Host bank details ────────────────────────────────────────────────────

  async saveHostBankDetails(
    hostId: string,
    {
      accountNumber,
      bankCode,
      bankName,
    }: { accountNumber: string; bankCode: string; bankName: string }
  ): Promise<User> {
    const host = await this.userRepo.findOne({ where: { id: hostId } });
    if (!host) throw new AppError("Host not found", 404);

    // Verify account with Paystack
    const { accountName } = await this.verifyAccount(accountNumber, bankCode);

    // Create / update transfer recipient on Paystack
    const recipientRes = await paystackRequest<PaystackRecipientResponse>(
      "POST",
      "/transferrecipient",
      {
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      }
    );

    if (!recipientRes.status) {
      throw new AppError(`Could not register bank account: ${recipientRes.message}`, 502);
    }

    await this.userRepo.update(hostId, {
      bankAccountNumber: accountNumber,
      bankCode,
      bankAccountName: accountName,
      bankName,
      paystackRecipientCode: recipientRes.data.recipient_code,
    });

    return (await this.userRepo.findOne({ where: { id: hostId } }))!;
  }

  async getHostBankDetails(hostId: string) {
    const host = await this.userRepo.findOne({ where: { id: hostId } });
    if (!host) throw new AppError("Host not found", 404);
    return {
      bankAccountNumber: host.bankAccountNumber,
      bankAccountName: host.bankAccountName,
      bankCode: host.bankCode,
      bankName: host.bankName,
      hasDetails: !!host.bankAccountNumber && !!host.paystackRecipientCode,
    };
  }

  // ── Payout processing ────────────────────────────────────────────────────

  async getPendingPayouts(): Promise<Booking[]> {
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

  async processHostPayout(bookingId: string): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ["property", "user"],
    });
    if (!booking) throw new AppError("Booking not found", 404);
    if (booking.paymentStatus !== "paid") throw new AppError("Payment has not been received for this booking", 400);
    if (booking.hostPayoutStatus === "transferred") throw new AppError("Payout already transferred", 400);
    if (booking.hostPayoutStatus === "processing") throw new AppError("Payout is already being processed", 400);

    // Fetch host details
    const hostId = booking.property?.hostId ?? booking.vehicle?.hostId;
    if (!hostId) throw new AppError("Cannot determine host for this booking", 400);
    const host = await this.userRepo.findOne({ where: { id: hostId } });
    if (!host) throw new AppError("Host not found", 404);
    if (!host.paystackRecipientCode) {
      throw new AppError("Host has not set up their bank account for payouts", 400);
    }

    const payoutAmountKobo = Math.round(Number(booking.hostPayout) * 100);
    if (payoutAmountKobo <= 0) throw new AppError("Invalid payout amount", 400);

    // Mark as processing first
    await this.bookingRepo.update(bookingId, { hostPayoutStatus: "processing" });

    const transferRes = await paystackRequest<PaystackTransferResponse>("POST", "/transfer", {
      source: "balance",
      amount: payoutAmountKobo,
      recipient: host.paystackRecipientCode,
      reason: `Asavio booking payout — ${bookingId.slice(0, 8).toUpperCase()}`,
    });

    if (!transferRes.status) {
      await this.bookingRepo.update(bookingId, { hostPayoutStatus: "failed" });

      notificationService.send({
        userId: host.id,
        type: "payout_failed",
        title: "Payout failed",
        body: `We could not transfer your payout for booking ${bookingId.slice(0, 8).toUpperCase()}. Our team will retry shortly.`,
        data: { url: `/dashboard/host/earnings`, urlLabel: "View earnings" },
      }).catch(console.error);

      notificationService.sendToAllAdmins({
        type: "payout_failed",
        title: "Payout failed — action required",
        body: `Payout failed for booking ${bookingId.slice(0, 8).toUpperCase()}: ${transferRes.message}`,
        data: { url: `/dashboard/admin`, urlLabel: "View payouts" },
      }).catch(console.error);

      throw new AppError(`Transfer failed: ${transferRes.message}`, 502);
    }

    await this.bookingRepo.update(bookingId, {
      hostPayoutStatus: "transferred",
      payoutReference: transferRes.data.transfer_code,
    });

    notificationService.send({
      userId: host.id,
      type: "payout_transferred",
      title: "Payout sent ✓",
      body: `₦${Number(booking.hostPayout).toLocaleString()} has been transferred to your bank account for booking ${bookingId.slice(0, 8).toUpperCase()}.`,
      data: { url: `/dashboard/host/earnings`, urlLabel: "View earnings" },
    }).catch(console.error);

    return (await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ["property", "user"],
    }))!;
  }
}

export const payoutService = new PayoutService();
