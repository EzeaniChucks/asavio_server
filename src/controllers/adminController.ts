// src/controllers/adminController.ts
import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/adminService";
import { settingsService } from "../services/settingsService";
import { iamService } from "../services/iamService";
import { supportService } from "../services/supportService";
import { catchAsync } from "../utils/catchAsync";
import type { AdminPermission } from "../constants/permissions";
import type { TicketStatus } from "../entities/SupportTicket";

/** Fire-and-forget audit log helper */
function audit(
  req: Request,
  action: string,
  targetType?: string,
  targetId?: string | string[],
  details?: Record<string, any>
) {
  const id = Array.isArray(targetId) ? targetId[0] : targetId;
  iamService
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

export const adminController = {
  getStats: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await adminService.getStats();
    res.json({ status: "success", data: { stats } });
  }),

  getUsers: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, role, search } = req.query;
    const result = await adminService.getUsers({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      role: role as string,
      search: search as string,
    });
    res.json({ status: "success", data: result });
  }),

  getUser: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await adminService.getUser(req.params.id as string);
    res.json({ status: "success", data: { user } });
  }),

  updateUser: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await adminService.updateUser(req.params.id as string, req.body);
    audit(req, "update_user", "user", req.params.id, req.body);
    res.json({ status: "success", data: { user } });
  }),

  deleteUser: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteUser(req.params.id as string);
    audit(req, "delete_user", "user", req.params.id);
    res.status(204).send();
  }),

  getProperties: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, search, status, isAvailable } = req.query;
    const result = await adminService.getProperties({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string,
      status: status as string,
      isAvailable: isAvailable !== undefined ? isAvailable === "true" : undefined,
    });
    res.json({ status: "success", data: result });
  }),

  updateProperty: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const property = await adminService.updateProperty(req.params.id as string, req.body);
    const action = req.body.status === "approved" ? "approve_property"
      : req.body.status === "rejected" ? "reject_property"
      : "update_property";
    audit(req, action, "property", req.params.id, req.body.status ? { status: req.body.status, rejectionReason: req.body.rejectionReason } : undefined);
    res.json({ status: "success", data: { property } });
  }),

  deleteProperty: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteProperty(req.params.id as string);
    audit(req, "delete_property", "property", req.params.id);
    res.status(204).send();
  }),

  getVehicles: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, search, status, isAvailable } = req.query;
    const result = await adminService.getVehicles({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string,
      status: status as string | undefined,
      isAvailable: isAvailable !== undefined ? isAvailable === "true" : undefined,
    });
    res.json({ status: "success", data: result });
  }),

  updateVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicle = await adminService.updateVehicle(req.params.id as string, req.body);
    audit(req, "update_vehicle", "vehicle", req.params.id);
    res.json({ status: "success", data: vehicle });
  }),

  deleteVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteVehicle(req.params.id as string);
    audit(req, "delete_vehicle", "vehicle", req.params.id);
    res.status(204).send();
  }),

  getBookings: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, status } = req.query;
    const result = await adminService.getBookings({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: status as string,
    });
    res.json({ status: "success", data: result });
  }),

  updateBookingStatus: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const booking = await adminService.updateBookingStatus(
      req.params.id as string,
      req.body.status
    );
    audit(req, "update_booking_status", "booking", req.params.id, { status: req.body.status });
    res.json({ status: "success", data: { booking } });
  }),

  verifyBookingPayment: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const booking = await adminService.verifyBookingPayment(req.params.id as string);
    audit(req, "verify_booking_payment", "booking", req.params.id, { paymentStatus: booking.paymentStatus });
    res.json({ status: "success", data: { booking } });
  }),

  // ── Support Tickets ───────────────────────────────────────────

  getSupportTickets: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, status } = req.query;
    const result = await supportService.getTickets({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: status as string,
    });
    res.json({ status: "success", data: result });
  }),

  getSupportTicket: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const ticket = await supportService.getTicket(req.params.id as string);
    res.json({ status: "success", data: { ticket } });
  }),

  respondToSupportTicket: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { response, status } = req.body;
    if (!response) {
      res.status(400).json({ status: "error", message: "response is required" });
      return;
    }
    const ticket = await supportService.respondToTicket(
      req.user.id,
      req.params.id as string,
      { response, status: (status ?? "resolved") as TicketStatus }
    );
    audit(req, "respond_support_ticket", "support_ticket", req.params.id, { status: ticket.status });
    res.json({ status: "success", data: { ticket } });
  }),

  updateSupportTicketStatus: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const ticket = await supportService.updateTicketStatus(
      req.params.id as string,
      req.body.status as TicketStatus
    );
    audit(req, "update_support_ticket_status", "support_ticket", req.params.id, { status: req.body.status });
    res.json({ status: "success", data: { ticket } });
  }),

  deleteReview: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteReview(req.params.id as string);
    audit(req, "delete_review", "review", req.params.id);
    res.status(204).send();
  }),

  sendDirectEmail: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { userId, subject, message } = req.body;
    await adminService.sendDirectEmail({ userId, subject, message });
    audit(req, "send_direct_email", "user", userId, { subject });
    res.json({ status: "success", data: { sent: true } });
  }),

  sendBroadcast: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await adminService.sendBroadcast(req.body);
    audit(req, "send_broadcast", undefined, undefined, { audience: req.body.audience, subject: req.body.subject, sent: result.sent });
    res.json({ status: "success", data: result });
  }),

  previewAudienceCount: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { audience } = req.query;
    const result = await adminService.previewAudienceCount(audience as any);
    res.json({ status: "success", data: result });
  }),

  // ── Platform Settings ─────────────────────────────────────────

  getSettings: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const settings = await settingsService.getSettings();
    res.json({ status: "success", data: { settings } });
  }),

  updateSettings: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { commissionRate } = req.body;
    const settings = await settingsService.updateCommissionRate(Number(commissionRate));
    audit(req, "update_settings", undefined, undefined, { commissionRate });
    res.json({ status: "success", data: { settings } });
  }),

  // ── Host detail (properties) ──────────────────────────────────

  getHostProperties: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await adminService.getHostProperties(req.params.id as string);
    res.json({ status: "success", data: result });
  }),

  // ── Per-host commission override ──────────────────────────────

  setHostCommissionRate: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { commissionRateOverride } = req.body;
    const override = commissionRateOverride === null || commissionRateOverride === undefined
      ? null
      : Number(commissionRateOverride);
    const user = await adminService.updateUser(req.params.id as string, { commissionRateOverride: override });
    audit(req, "set_host_commission", "user", req.params.id, { commissionRateOverride: override });
    res.json({ status: "success", data: { user } });
  }),

  // ── IAM ───────────────────────────────────────────────────────

  listAdmins: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const admins = await iamService.listAdmins();
    res.json({ status: "success", data: { admins } });
  }),

  createAdmin: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const admin = await iamService.createAdmin(req.body);
    audit(req, "create_admin", "user", admin.id, { email: admin.email, adminPermissions: admin.adminPermissions });
    res.status(201).json({ status: "success", data: { admin } });
  }),

  updateAdminPermissions: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const admin = await iamService.updateAdminPermissions(
      req.params.id as string,
      req.body.adminPermissions as AdminPermission[]
    );
    audit(req, "update_admin_permissions", "user", req.params.id, { adminPermissions: req.body.adminPermissions });
    res.json({ status: "success", data: { admin } });
  }),

  revokeAdmin: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await iamService.revokeAdmin(req.params.id as string, req.user.id);
    audit(req, "revoke_admin", "user", req.params.id);
    res.status(204).send();
  }),

  // ── Audit logs ────────────────────────────────────────────────

  getAuditLogs: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, adminId, action } = req.query;
    const result = await iamService.getAuditLogs({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      adminId: adminId as string,
      action: action as string,
    });
    res.json({ status: "success", data: result });
  }),
};
