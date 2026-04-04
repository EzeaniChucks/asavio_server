// src/controllers/vehicleController.ts
import { Request, Response, NextFunction } from "express";
import { vehicleService } from "../services/vehicleService";
import { CloudinaryService } from "../services/cloudinaryService";
import { subscriptionService } from "../services/subscriptionService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { TIER_CONFIG } from "../constants/subscriptionTiers";

const cloudinaryService = new CloudinaryService();

export const vehicleController = {
  getAvailableVehicleTypes: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const types = await vehicleService.getAvailableVehicleTypes();
    res.status(200).json({ status: "success", data: { types } });
  }),

  getVehicleTypeRepresentatives: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const vehicles = await vehicleService.getVehicleTypeRepresentatives();
    res.status(200).json({ status: "success", data: { vehicles } });
  }),

  listVehicles: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { vehicleType, minPrice, maxPrice, withDriver, location, seats, sort, page, limit } = req.query;
    const result = await vehicleService.getVehicles({
      vehicleType: vehicleType as string,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      withDriver: withDriver !== undefined ? withDriver === "true" : undefined,
      location: location as string,
      seats: seats ? Number(seats) : undefined,
      sort: sort as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });
    res.json({ status: "success", data: result });
  }),

  getVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    res.json({ status: "success", data: { vehicle } });
  }),

  createVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    // Check listing limit
    await subscriptionService.checkListingLimit(req.user!.id, "vehicle");

    const files = (req.files as Express.Multer.File[]) ?? [];

    // Enforce photo limit
    if (files.length > 0) {
      const tier = req.user!.subscriptionTier ?? "starter";
      const maxPhotos = TIER_CONFIG[tier].maxPhotos;
      if (files.length > maxPhotos) {
        throw new AppError(
          `Your ${TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing.`,
          400
        );
      }
    }

    const vehicle = await vehicleService.createVehicle(req.user!.id, req.body, files);
    res.status(201).json({ status: "success", data: { vehicle } });
  }),

  updateVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    // Enforce photo limit on update
    if (files.length > 0) {
      const existing = await vehicleService.getVehicleById(req.params.id as string);
      const removePublicIds: string[] = Array.isArray(req.body.removeImagePublicIds)
        ? req.body.removeImagePublicIds
        : req.body.removeImagePublicIds ? [req.body.removeImagePublicIds] : [];
      const currentCount = (existing.images?.length ?? 0) - removePublicIds.length;
      const newTotal = currentCount + files.length;
      const tier = req.user!.subscriptionTier ?? "starter";
      const maxPhotos = TIER_CONFIG[tier].maxPhotos;
      if (newTotal > maxPhotos) {
        throw new AppError(
          `Your ${TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing.`,
          400
        );
      }
    }

    const vehicle = await vehicleService.updateVehicle(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      req.body,
      files.length ? files : undefined
    );
    res.json({ status: "success", data: { vehicle } });
  }),

  deleteVehicle: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await vehicleService.deleteVehicle(req.params.id as string, req.user!.id, req.user!.role);
    res.status(204).send();
  }),

  toggleAvailability: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicle = await vehicleService.toggleAvailability(req.params.id as string, req.user!.id);
    res.json({ status: "success", data: { vehicle } });
  }),

  getMyVehicles: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicles = await vehicleService.getHostVehicles(req.user!.id);
    res.json({ status: "success", data: { vehicles } });
  }),

  /** POST /api/vehicles/:id/feature-video — upload a feature video (Pro/Elite) */
  uploadFeatureVideo: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const file = req.file;
    if (!file) throw new AppError("No video file uploaded", 400);

    const tier = req.user!.subscriptionTier ?? "starter";
    const tierCfg = TIER_CONFIG[tier];
    const maxSizeBytes = tierCfg.videoMaxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new AppError(
        `Video file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
          `Your ${tierCfg.label} plan allows up to ${tierCfg.videoMaxSizeMB} MB.`,
        400
      );
    }

    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    if (vehicle.hostId !== req.user!.id && req.user!.role !== "admin") {
      throw new AppError("You can only update your own listings", 403);
    }

    // Delete old video from Cloudinary if present
    if (vehicle.featureVideoPublicId) {
      await cloudinaryService.deleteVideo(vehicle.featureVideoPublicId).catch(() => {});
    }

    const uploaded = await cloudinaryService.uploadVideo(
      file,
      "listing-videos",
      tierCfg.videoMaxSeconds
    );

    const updated = await vehicleService.updateVehicle(
      vehicle.id,
      req.user!.id,
      req.user!.role,
      { featureVideoUrl: uploaded.url, featureVideoPublicId: uploaded.publicId } as any
    );

    res.json({ status: "success", data: { vehicle: updated } });
  }),

  /** DELETE /api/vehicles/:id/feature-video — remove the feature video */
  deleteFeatureVideo: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const vehicle = await vehicleService.getVehicleById(req.params.id as string);
    if (vehicle.hostId !== req.user!.id && req.user!.role !== "admin") {
      throw new AppError("You can only update your own listings", 403);
    }

    if (vehicle.featureVideoPublicId) {
      await cloudinaryService.deleteVideo(vehicle.featureVideoPublicId).catch(() => {});
    }

    const updated = await vehicleService.updateVehicle(
      vehicle.id,
      req.user!.id,
      req.user!.role,
      { featureVideoUrl: null, featureVideoPublicId: null } as any
    );

    res.json({ status: "success", data: { vehicle: updated } });
  }),
};
