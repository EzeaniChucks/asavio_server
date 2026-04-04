// src/controllers/propertyController.ts
import { Request, Response } from "express";
import { PropertyService } from "../services/propertyService";
import { CloudinaryService } from "../services/cloudinaryService";
import { emailService } from "../services/emailService";
import { notificationService } from "../services/notificationService";
import { subscriptionService } from "../services/subscriptionService";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { TIER_CONFIG } from "../constants/subscriptionTiers";

const propertyService = new PropertyService();
const cloudinaryService = new CloudinaryService();

export const propertyController = {
  createProperty: catchAsync(async (req: Request, res: Response) => {
    // Check listing limit before doing anything
    await subscriptionService.checkListingLimit(req.user.id, "property");

    const files = req.files as Express.Multer.File[];
    let uploadedImages: { url: string; publicId: string }[] = [];

    if (files && files.length > 0) {
      // Enforce photo limit based on subscription tier
      const tier = req.user.subscriptionTier ?? "starter";
      const maxPhotos = TIER_CONFIG[tier].maxPhotos;
      if (files.length > maxPhotos) {
        throw new AppError(
          `Your ${TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing.`,
          400
        );
      }
      uploadedImages = await cloudinaryService.uploadMultipleImages(files, "properties");
    }

    const property = await propertyService.createProperty(
      req.body,
      req.user.id,
      uploadedImages
    );

    // In-app notification to all admins
    notificationService.sendToAllAdmins({
      type: "listing_submitted",
      title: "New listing pending review",
      body: `${req.user.firstName ?? "A host"} has submitted "${property.title}" for approval.`,
      data: { url: `/dashboard/admin`, urlLabel: "Review listing" },
    }).catch(console.error);

    // Notify all admins of the new pending listing (best-effort)
    AppDataSource.getRepository(User)
      .find({ where: { role: "admin" } })
      .then((admins) =>
        Promise.all(
          admins.map((admin) =>
            emailService
              .sendListingSubmitted({
                to: admin.email,
                propertyTitle: property.title,
                hostName: req.user.firstName ?? "A host",
                propertyId: property.id,
              })
              .catch(console.error)
          )
        )
      )
      .catch(console.error);

    res.status(201).json({
      status: "success",
      data: { property },
    });
  }),

  getProperty: catchAsync(async (req: Request, res: Response) => {
    // trackView=true increments viewCount asynchronously
    const property = await propertyService.getPropertyById(req.params.id as string, true);

    res.status(200).json({
      status: "success",
      data: { property },
    });
  }),

  getAllProperties: catchAsync(async (req: Request, res: Response) => {
    const properties = await propertyService.getAllProperties(req.query);

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: { properties },
    });
  }),

  getHomeSections: catchAsync(async (_req: Request, res: Response) => {
    const sections = await propertyService.getHomeSections();
    res.status(200).json({ status: "success", data: sections });
  }),

  getMyProperties: catchAsync(async (req: Request, res: Response) => {
    const properties = await propertyService.getMyProperties(req.user.id);

    res.status(200).json({
      status: "success",
      results: properties.length,
      data: { properties },
    });
  }),

  getAvailablePropertyTypes: catchAsync(async (_req: Request, res: Response) => {
    const types = await propertyService.getAvailablePropertyTypes();

    res.status(200).json({
      status: "success",
      data: { types },
    });
  }),

  getTypeRepresentatives: catchAsync(async (_req: Request, res: Response) => {
    const representatives = await propertyService.getTypeRepresentatives();
    res.status(200).json({ status: "success", data: { representatives } });
  }),

  /** GET /api/properties/analytics — host's analytics (Pro/Elite) */
  getAnalytics: catchAsync(async (req: Request, res: Response) => {
    const analytics = await propertyService.getHostAnalytics(req.user.id);
    res.status(200).json({ status: "success", data: analytics });
  }),

  updateProperty: catchAsync(async (req: Request, res: Response) => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    let removeImagePublicIds: string[] = [];
    try {
      const raw = req.body.removeImagePublicIds;
      if (raw) removeImagePublicIds = Array.isArray(raw) ? raw : [raw];
    } catch { /* ignore */ }

    // Photo limit check: existing images (minus removed) + new files
    if (files.length > 0) {
      const existing = await propertyService.getPropertyById(req.params.id as string);
      const currentCount = (existing.images?.length ?? 0) - removeImagePublicIds.length;
      const newTotal = currentCount + files.length;
      const tier = req.user.subscriptionTier ?? "starter";
      const maxPhotos = TIER_CONFIG[tier].maxPhotos;
      if (newTotal > maxPhotos) {
        throw new AppError(
          `Your ${TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing. ` +
            `You currently have ${currentCount} and are adding ${files.length}.`,
          400
        );
      }
    }

    const property = await propertyService.updateProperty(
      req.params.id as string,
      req.body,
      req.user.id,
      removeImagePublicIds,
      files.length ? files : undefined,
    );
    res.status(200).json({ status: "success", data: { property } });
  }),

  deleteProperty: catchAsync(async (req: Request, res: Response) => {
    await propertyService.deleteProperty(req.params.id as string, req.user.id);

    res.status(204).json({
      status: "success",
      data: null,
    });
  }),

  getBookedDates: catchAsync(async (req: Request, res: Response) => {
    const bookedDates = await propertyService.getBookedDates(req.params.id as string);
    res.json({ status: "success", data: { bookedDates } });
  }),

  updateBlockedDates: catchAsync(async (req: Request, res: Response) => {
    const { blockedDates } = req.body;
    if (!Array.isArray(blockedDates)) {
      res.status(400).json({ status: "error", message: "blockedDates must be an array" });
      return;
    }
    await propertyService.updateBlockedDates(req.params.id as string, req.user.id, blockedDates);
    res.json({ status: "success", data: null });
  }),

  /** POST /api/properties/:id/feature-video — upload a feature video (Pro/Elite) */
  uploadFeatureVideo: catchAsync(async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) throw new AppError("No video file uploaded", 400);

    const tier = req.user.subscriptionTier ?? "starter";
    const tierCfg = TIER_CONFIG[tier];
    const maxSizeBytes = tierCfg.videoMaxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new AppError(
        `Video file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
          `Your ${tierCfg.label} plan allows up to ${tierCfg.videoMaxSizeMB} MB.`,
        400
      );
    }

    // Verify the host owns this property
    const property = await propertyService.getPropertyById(req.params.id as string);
    if (property.hostId !== req.user.id && req.user.role !== "admin") {
      throw new AppError("You can only update your own listings", 403);
    }

    // Delete old video from Cloudinary if present
    if (property.featureVideoPublicId) {
      await cloudinaryService.deleteVideo(property.featureVideoPublicId).catch(() => {});
    }

    const uploaded = await cloudinaryService.uploadVideo(
      file,
      "listing-videos",
      tierCfg.videoMaxSeconds
    );

    const updated = await propertyService.updateProperty(
      property.id,
      {
        featureVideoUrl: uploaded.url,
        featureVideoPublicId: uploaded.publicId,
      },
      req.user.id
    );

    res.json({ status: "success", data: { property: updated } });
  }),

  /** DELETE /api/properties/:id/feature-video — remove the feature video */
  deleteFeatureVideo: catchAsync(async (req: Request, res: Response) => {
    const property = await propertyService.getPropertyById(req.params.id as string);
    if (property.hostId !== req.user.id && req.user.role !== "admin") {
      throw new AppError("You can only update your own listings", 403);
    }

    if (property.featureVideoPublicId) {
      await cloudinaryService.deleteVideo(property.featureVideoPublicId).catch(() => {});
    }

    await propertyService.updateProperty(
      property.id,
      { featureVideoUrl: null, featureVideoPublicId: null },
      req.user.id
    );

    res.json({ status: "success", data: null });
  }),
};
