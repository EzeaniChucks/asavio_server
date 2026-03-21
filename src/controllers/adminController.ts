// src/controllers/adminController.ts
import { Request, Response, NextFunction } from "express";
import { adminService } from "../services/adminService";
import { settingsService } from "../services/settingsService";
import { catchAsync } from "../utils/catchAsync";

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

  updateUser: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const user = await adminService.updateUser(req.params.id as string, req.body);
    res.json({ status: "success", data: { user } });
  }),

  deleteUser: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteUser(req.params.id as string);
    res.status(204).send();
  }),

  getProperties: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, search, status } = req.query;
    const result = await adminService.getProperties({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string,
      status: status as string,
    });
    res.json({ status: "success", data: result });
  }),

  updateProperty: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const property = await adminService.updateProperty(req.params.id as string, req.body);
    res.json({ status: "success", data: { property } });
  }),

  deleteProperty: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteProperty(req.params.id as string);
    res.status(204).send();
  }),

  getVehicles: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { page, limit, search } = req.query;
    const result = await adminService.getVehicles({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string,
    });
    res.json({ status: "success", data: result });
  }),

  deleteVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteVehicle(req.params.id as string);
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
    res.json({ status: "success", data: { booking } });
  }),

  deleteReview: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await adminService.deleteReview(req.params.id as string);
    res.status(204).send();
  }),

  sendBroadcast: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const result = await adminService.sendBroadcast(req.body);
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
    // Pass null to clear the override (revert to global rate)
    const override = commissionRateOverride === null || commissionRateOverride === undefined
      ? null
      : Number(commissionRateOverride);
    const user = await adminService.updateUser(req.params.id as string, { commissionRateOverride: override });
    res.json({ status: "success", data: { user } });
  }),
};
