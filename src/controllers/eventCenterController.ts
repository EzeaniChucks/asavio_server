// src/controllers/eventCenterController.ts
import { Request, Response, NextFunction } from "express";
import { eventCenterService } from "../services/eventCenterService";
import { settingsService } from "../services/settingsService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

export const eventCenterController = {
  // ── Public ──────────────────────────────────────────────────────────

  listEventCenters: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { city, eventType, minCapacity, minPrice, maxPrice, sort, page, limit } = req.query;
    const result = await eventCenterService.getAll({
      city: city as string,
      eventType: eventType as string,
      minCapacity: minCapacity ? Number(minCapacity) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });
    res.json({ status: "success", data: result });
  }),

  getEventCenter: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const ec = await eventCenterService.getById(req.params.id as string);
    res.json({ status: "success", data: { eventCenter: ec } });
  }),

  // ── Host/Admin: event center CRUD ───────────────────────────────────

  createEventCenter: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    if (files.length > 0) {
      const tier = req.user!.subscriptionTier ?? "starter";
      const tierConfig = await settingsService.getActiveTierConfig();
      const { maxPhotos, label } = tierConfig[tier];
      if (files.length > maxPhotos) {
        throw new AppError(`Your ${label} plan allows up to ${maxPhotos} photos per listing.`, 400);
      }
    }

    const body = { ...req.body };
    if (typeof body.location === "string") body.location = JSON.parse(body.location);
    if (typeof body.amenities === "string") body.amenities = JSON.parse(body.amenities);
    if (typeof body.nearbyPlaces === "string") body.nearbyPlaces = JSON.parse(body.nearbyPlaces);
    if (typeof body.allowedEventTypes === "string") body.allowedEventTypes = JSON.parse(body.allowedEventTypes);
    if (typeof body.blockedEventTypes === "string") body.blockedEventTypes = JSON.parse(body.blockedEventTypes);

    const ec = await eventCenterService.createEventCenter(req.user!.id, body, files);
    res.status(201).json({ status: "success", data: { eventCenter: ec } });
  }),

  updateEventCenter: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const body = { ...req.body };
    if (typeof body.location === "string") body.location = JSON.parse(body.location);
    if (typeof body.amenities === "string") body.amenities = JSON.parse(body.amenities);
    if (typeof body.nearbyPlaces === "string") body.nearbyPlaces = JSON.parse(body.nearbyPlaces);
    if (typeof body.allowedEventTypes === "string") body.allowedEventTypes = JSON.parse(body.allowedEventTypes);
    if (typeof body.blockedEventTypes === "string") body.blockedEventTypes = JSON.parse(body.blockedEventTypes);

    const ec = await eventCenterService.update(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      body,
      files.length ? files : undefined
    );
    res.json({ status: "success", data: { eventCenter: ec } });
  }),

  deleteEventCenter: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await eventCenterService.deleteEventCenter(req.params.id as string, req.user!.id, req.user!.role);
    res.status(204).send();
  }),

  toggleAvailability: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const ec = await eventCenterService.toggleAvailability(req.params.id as string, req.user!.id);
    res.json({ status: "success", data: { eventCenter: ec } });
  }),

  getMyEventCenters: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const ecs = await eventCenterService.getHostEventCenters(req.user!.id);
    res.json({ status: "success", data: { eventCenters: ecs } });
  }),

  // ── Spaces ──────────────────────────────────────────────────────────

  createSpace: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const body = { ...req.body };
    const space = await eventCenterService.createSpace(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      body,
      files
    );
    res.status(201).json({ status: "success", data: { space } });
  }),

  updateSpace: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const space = await eventCenterService.updateSpace(
      req.params.spaceId as string,
      req.user!.id,
      req.user!.role,
      req.body,
      files.length ? files : undefined
    );
    res.json({ status: "success", data: { space } });
  }),

  deleteSpace: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await eventCenterService.deleteSpace(req.params.spaceId as string, req.user!.id, req.user!.role);
    res.status(204).send();
  }),
};
