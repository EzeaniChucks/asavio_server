"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutController = void 0;
const payoutService_1 = require("../services/payoutService");
const catchAsync_1 = require("../utils/catchAsync");
exports.payoutController = {
    // ── Public / host ────────────────────────────────────────────────────────
    getBanks: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const banks = await payoutService_1.payoutService.getBanks();
        res.json({ status: "success", data: { banks } });
    }),
    verifyAccount: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { accountNumber, bankCode } = req.query;
        if (!accountNumber || !bankCode) {
            res.status(400).json({ status: "error", message: "accountNumber and bankCode are required" });
            return;
        }
        const result = await payoutService_1.payoutService.verifyAccount(accountNumber, bankCode);
        res.json({ status: "success", data: result });
    }),
    saveBankDetails: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { accountNumber, bankCode, bankName } = req.body;
        if (!accountNumber || !bankCode || !bankName) {
            res.status(400).json({ status: "error", message: "accountNumber, bankCode, and bankName are required" });
            return;
        }
        const host = await payoutService_1.payoutService.saveHostBankDetails(req.user.id, { accountNumber, bankCode, bankName });
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
    getBankDetails: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const details = await payoutService_1.payoutService.getHostBankDetails(req.user.id);
        res.json({ status: "success", data: details });
    }),
    // ── Admin ────────────────────────────────────────────────────────────────
    getPendingPayouts: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const bookings = await payoutService_1.payoutService.getPendingPayouts();
        res.json({ status: "success", data: { bookings } });
    }),
    processHostPayout: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const booking = await payoutService_1.payoutService.processHostPayout(req.params.bookingId);
        res.json({ status: "success", data: { booking } });
    }),
};
//# sourceMappingURL=payoutController.js.map