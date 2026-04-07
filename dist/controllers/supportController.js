"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportController = void 0;
const supportService_1 = require("../services/supportService");
const catchAsync_1 = require("../utils/catchAsync");
exports.supportController = {
    // ── Guest ─────────────────────────────────────────────────────────────────
    createTicket: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { subject, category, message } = req.body;
        if (!subject || !message) {
            res.status(400).json({ status: "error", message: "subject and message are required" });
            return;
        }
        const ticket = await supportService_1.supportService.createTicket(req.user.id, { subject, category: category ?? "other", message });
        res.status(201).json({ status: "success", data: { ticket } });
    }),
    getMyTickets: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const tickets = await supportService_1.supportService.getMyTickets(req.user.id);
        res.json({ status: "success", data: { tickets } });
    }),
    getMyTicket: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const ticket = await supportService_1.supportService.getMyTicket(req.user.id, req.params.id);
        res.json({ status: "success", data: { ticket } });
    }),
};
//# sourceMappingURL=supportController.js.map