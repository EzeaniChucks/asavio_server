"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentController = void 0;
const paymentService_1 = require("../services/paymentService");
const catchAsync_1 = require("../utils/catchAsync");
exports.paymentController = {
    initializePayment: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { bookingId } = req.body;
        if (!bookingId) {
            res
                .status(400)
                .json({ status: "error", message: "bookingId is required" });
            return;
        }
        const result = await paymentService_1.paymentService.initializePayment(bookingId, req.user.id);
        res.json({ status: "success", data: result });
    }),
    verifyPayment: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { reference } = req.params;
        const booking = await paymentService_1.paymentService.verifyPayment(reference);
        res.json({ status: "success", data: { booking } });
    }),
    webhook: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const signature = req.headers["x-paystack-signature"];
        if (!signature) {
            res.status(400).json({ status: "error", message: "Missing signature" });
            return;
        }
        // rawBody is attached by the express.json verify callback in app.ts
        const rawBody = req.rawBody;
        await paymentService_1.paymentService.handleWebhook(rawBody, signature);
        res.status(200).json({ status: "success" });
    }),
};
//# sourceMappingURL=paymentController.js.map