// src/controllers/payoutController.ts
import { Request, Response, NextFunction } from "express";
import { payoutService } from "../services/payoutService";
import { catchAsync } from "../utils/catchAsync";

export const payoutController = {
  // ── Public / host ────────────────────────────────────────────────────────

  getBanks: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const banks = await payoutService.getBanks();
    res.json({ status: "success", data: { banks } });
  }),

  verifyAccount: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { accountNumber, bankCode } = req.query as Record<string, string>;
    if (!accountNumber || !bankCode) {
      res.status(400).json({ status: "error", message: "accountNumber and bankCode are required" });
      return;
    }
    const result = await payoutService.verifyAccount(accountNumber, bankCode);
    res.json({ status: "success", data: result });
  }),

  saveBankDetails: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { accountNumber, bankCode, bankName } = req.body;
    if (!accountNumber || !bankCode || !bankName) {
      res.status(400).json({ status: "error", message: "accountNumber, bankCode, and bankName are required" });
      return;
    }
    const host = await payoutService.saveHostBankDetails(req.user!.id, { accountNumber, bankCode, bankName });
    res.json({
      status: "success",
      data: {
        bankAccountNumber: host.bankAccountNumber,
        bankAccountName: host.bankAccountName,
        bankName: host.bankName,
        hasDetails: true,
      },
    });
  }),

  getBankDetails: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const details = await payoutService.getHostBankDetails(req.user!.id);
    res.json({ status: "success", data: details });
  }),

  // ── Admin ────────────────────────────────────────────────────────────────

  getPendingPayouts: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const bookings = await payoutService.getPendingPayouts();
    res.json({ status: "success", data: { bookings } });
  }),

  processHostPayout: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const booking = await payoutService.processHostPayout(req.params.bookingId as string);
    res.json({ status: "success", data: { booking } });
  }),
};
