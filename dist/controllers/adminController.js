"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const adminService_1 = require("../services/adminService");
const settingsService_1 = require("../services/settingsService");
const iamService_1 = require("../services/iamService");
const supportService_1 = require("../services/supportService");
const catchAsync_1 = require("../utils/catchAsync");
/** Fire-and-forget audit log helper */
function audit(req, action, targetType, targetId, details) {
    const id = Array.isArray(targetId) ? targetId[0] : targetId;
    iamService_1.iamService
        .logAction({
        adminId: req.user.id,
        adminEmail: req.user.email,
        adminName: `${req.user.firstName} ${req.user.lastName}`,
        action,
        targetType,
        targetId: id,
        details,
    })
        .catch(console.error);
}
exports.adminController = {
    getStats: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const stats = await adminService_1.adminService.getStats();
        res.json({ status: "success", data: { stats } });
    }),
    getUsers: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, role, search } = req.query;
        const result = await adminService_1.adminService.getUsers({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            role: role,
            search: search,
        });
        res.json({ status: "success", data: result });
    }),
    getUser: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const user = await adminService_1.adminService.getUser(req.params.id);
        res.json({ status: "success", data: { user } });
    }),
    updateUser: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const user = await adminService_1.adminService.updateUser(req.params.id, req.body);
        audit(req, "update_user", "user", req.params.id, req.body);
        res.json({ status: "success", data: { user } });
    }),
    deleteUser: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteUser(req.params.id);
        audit(req, "delete_user", "user", req.params.id);
        res.status(204).send();
    }),
    getProperties: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, search, status, isAvailable } = req.query;
        const result = await adminService_1.adminService.getProperties({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            search: search,
            status: status,
            isAvailable: isAvailable !== undefined ? isAvailable === "true" : undefined,
        });
        res.json({ status: "success", data: result });
    }),
    updateProperty: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const property = await adminService_1.adminService.updateProperty(req.params.id, req.body);
        const action = req.body.status === "approved" ? "approve_property"
            : req.body.status === "rejected" ? "reject_property"
                : "update_property";
        audit(req, action, "property", req.params.id, req.body.status ? { status: req.body.status, rejectionReason: req.body.rejectionReason } : undefined);
        res.json({ status: "success", data: { property } });
    }),
    deleteProperty: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteProperty(req.params.id);
        audit(req, "delete_property", "property", req.params.id);
        res.status(204).send();
    }),
    getVehicles: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, search, status, isAvailable } = req.query;
        const result = await adminService_1.adminService.getVehicles({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            search: search,
            status: status,
            isAvailable: isAvailable !== undefined ? isAvailable === "true" : undefined,
        });
        res.json({ status: "success", data: result });
    }),
    updateVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const vehicle = await adminService_1.adminService.updateVehicle(req.params.id, req.body);
        audit(req, "update_vehicle", "vehicle", req.params.id);
        res.json({ status: "success", data: vehicle });
    }),
    deleteVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteVehicle(req.params.id);
        audit(req, "delete_vehicle", "vehicle", req.params.id);
        res.status(204).send();
    }),
    getBookings: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, status } = req.query;
        const result = await adminService_1.adminService.getBookings({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            status: status,
        });
        res.json({ status: "success", data: result });
    }),
    updateBookingStatus: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const booking = await adminService_1.adminService.updateBookingStatus(req.params.id, req.body.status);
        audit(req, "update_booking_status", "booking", req.params.id, { status: req.body.status });
        res.json({ status: "success", data: { booking } });
    }),
    verifyBookingPayment: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const booking = await adminService_1.adminService.verifyBookingPayment(req.params.id);
        audit(req, "verify_booking_payment", "booking", req.params.id, { paymentStatus: booking.paymentStatus });
        res.json({ status: "success", data: { booking } });
    }),
    // ── Support Tickets ───────────────────────────────────────────
    getSupportTickets: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, status } = req.query;
        const result = await supportService_1.supportService.getTickets({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            status: status,
        });
        res.json({ status: "success", data: result });
    }),
    getSupportTicket: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const ticket = await supportService_1.supportService.getTicket(req.params.id);
        res.json({ status: "success", data: { ticket } });
    }),
    respondToSupportTicket: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { response, status } = req.body;
        if (!response) {
            res.status(400).json({ status: "error", message: "response is required" });
            return;
        }
        const ticket = await supportService_1.supportService.respondToTicket(req.user.id, req.params.id, { response, status: (status ?? "resolved") });
        audit(req, "respond_support_ticket", "support_ticket", req.params.id, { status: ticket.status });
        res.json({ status: "success", data: { ticket } });
    }),
    updateSupportTicketStatus: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const ticket = await supportService_1.supportService.updateTicketStatus(req.params.id, req.body.status);
        audit(req, "update_support_ticket_status", "support_ticket", req.params.id, { status: req.body.status });
        res.json({ status: "success", data: { ticket } });
    }),
    deleteReview: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteReview(req.params.id);
        audit(req, "delete_review", "review", req.params.id);
        res.status(204).send();
    }),
    sendDirectEmail: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { userId, subject, message } = req.body;
        await adminService_1.adminService.sendDirectEmail({ userId, subject, message });
        audit(req, "send_direct_email", "user", userId, { subject });
        res.json({ status: "success", data: { sent: true } });
    }),
    sendBroadcast: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const result = await adminService_1.adminService.sendBroadcast(req.body);
        audit(req, "send_broadcast", undefined, undefined, { audience: req.body.audience, subject: req.body.subject, sent: result.sent });
        res.json({ status: "success", data: result });
    }),
    previewAudienceCount: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { audience } = req.query;
        const result = await adminService_1.adminService.previewAudienceCount(audience);
        res.json({ status: "success", data: result });
    }),
    // ── Platform Settings ─────────────────────────────────────────
    getSettings: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const settings = await settingsService_1.settingsService.getSettings();
        res.json({ status: "success", data: { settings } });
    }),
    updateSettings: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { commissionRate } = req.body;
        const settings = await settingsService_1.settingsService.updateCommissionRate(Number(commissionRate));
        audit(req, "update_settings", undefined, undefined, { commissionRate });
        res.json({ status: "success", data: { settings } });
    }),
    // ── Host detail (properties) ──────────────────────────────────
    getHostProperties: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const result = await adminService_1.adminService.getHostProperties(req.params.id);
        res.json({ status: "success", data: result });
    }),
    // ── Per-host commission override ──────────────────────────────
    setHostCommissionRate: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { commissionRateOverride } = req.body;
        const override = commissionRateOverride === null || commissionRateOverride === undefined
            ? null
            : Number(commissionRateOverride);
        const user = await adminService_1.adminService.updateUser(req.params.id, { commissionRateOverride: override });
        audit(req, "set_host_commission", "user", req.params.id, { commissionRateOverride: override });
        res.json({ status: "success", data: { user } });
    }),
    // ── IAM ───────────────────────────────────────────────────────
    listAdmins: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const admins = await iamService_1.iamService.listAdmins();
        res.json({ status: "success", data: { admins } });
    }),
    createAdmin: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const admin = await iamService_1.iamService.createAdmin(req.body);
        audit(req, "create_admin", "user", admin.id, { email: admin.email, adminPermissions: admin.adminPermissions });
        res.status(201).json({ status: "success", data: { admin } });
    }),
    updateAdminPermissions: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const admin = await iamService_1.iamService.updateAdminPermissions(req.params.id, req.body.adminPermissions);
        audit(req, "update_admin_permissions", "user", req.params.id, { adminPermissions: req.body.adminPermissions });
        res.json({ status: "success", data: { admin } });
    }),
    revokeAdmin: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await iamService_1.iamService.revokeAdmin(req.params.id, req.user.id);
        audit(req, "revoke_admin", "user", req.params.id);
        res.status(204).send();
    }),
    // ── Audit logs ────────────────────────────────────────────────
    getAuditLogs: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, adminId, action } = req.query;
        const result = await iamService_1.iamService.getAuditLogs({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            adminId: adminId,
            action: action,
        });
        res.json({ status: "success", data: result });
    }),
};
//# sourceMappingURL=adminController.js.map