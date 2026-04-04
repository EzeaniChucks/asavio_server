"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyController = void 0;
const propertyService_1 = require("../services/propertyService");
const cloudinaryService_1 = require("../services/cloudinaryService");
const emailService_1 = require("../services/emailService");
const notificationService_1 = require("../services/notificationService");
const subscriptionService_1 = require("../services/subscriptionService");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
const subscriptionTiers_1 = require("../constants/subscriptionTiers");
const propertyService = new propertyService_1.PropertyService();
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
exports.propertyController = {
    createProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        // Check listing limit before doing anything
        await subscriptionService_1.subscriptionService.checkListingLimit(req.user.id, "property");
        const files = req.files;
        let uploadedImages = [];
        if (files && files.length > 0) {
            // Enforce photo limit based on subscription tier
            const tier = req.user.subscriptionTier ?? "starter";
            const maxPhotos = subscriptionTiers_1.TIER_CONFIG[tier].maxPhotos;
            if (files.length > maxPhotos) {
                throw new AppError_1.AppError(`Your ${subscriptionTiers_1.TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing.`, 400);
            }
            uploadedImages = await cloudinaryService.uploadMultipleImages(files, "properties");
        }
        const property = await propertyService.createProperty(req.body, req.user.id, uploadedImages);
        // In-app notification to all admins
        notificationService_1.notificationService.sendToAllAdmins({
            type: "listing_submitted",
            title: "New listing pending review",
            body: `${req.user.firstName ?? "A host"} has submitted "${property.title}" for approval.`,
            data: { url: `/dashboard/admin`, urlLabel: "Review listing" },
        }).catch(console.error);
        // Notify all admins of the new pending listing (best-effort)
        database_1.AppDataSource.getRepository(User_1.User)
            .find({ where: { role: "admin" } })
            .then((admins) => Promise.all(admins.map((admin) => emailService_1.emailService
            .sendListingSubmitted({
            to: admin.email,
            propertyTitle: property.title,
            hostName: req.user.firstName ?? "A host",
            propertyId: property.id,
        })
            .catch(console.error))))
            .catch(console.error);
        res.status(201).json({
            status: "success",
            data: { property },
        });
    }),
    getProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        // trackView=true increments viewCount asynchronously
        const property = await propertyService.getPropertyById(req.params.id, true);
        res.status(200).json({
            status: "success",
            data: { property },
        });
    }),
    getAllProperties: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const properties = await propertyService.getAllProperties(req.query);
        res.status(200).json({
            status: "success",
            results: properties.length,
            data: { properties },
        });
    }),
    getHomeSections: (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const sections = await propertyService.getHomeSections();
        res.status(200).json({ status: "success", data: sections });
    }),
    getMyProperties: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const properties = await propertyService.getMyProperties(req.user.id);
        res.status(200).json({
            status: "success",
            results: properties.length,
            data: { properties },
        });
    }),
    getAvailablePropertyTypes: (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const types = await propertyService.getAvailablePropertyTypes();
        res.status(200).json({
            status: "success",
            data: { types },
        });
    }),
    getTypeRepresentatives: (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const representatives = await propertyService.getTypeRepresentatives();
        res.status(200).json({ status: "success", data: { representatives } });
    }),
    /** GET /api/properties/analytics — host's analytics (Pro/Elite) */
    getAnalytics: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const analytics = await propertyService.getHostAnalytics(req.user.id);
        res.status(200).json({ status: "success", data: analytics });
    }),
    updateProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const files = req.files ?? [];
        let removeImagePublicIds = [];
        try {
            const raw = req.body.removeImagePublicIds;
            if (raw)
                removeImagePublicIds = Array.isArray(raw) ? raw : [raw];
        }
        catch { /* ignore */ }
        // Photo limit check: existing images (minus removed) + new files
        if (files.length > 0) {
            const existing = await propertyService.getPropertyById(req.params.id);
            const currentCount = (existing.images?.length ?? 0) - removeImagePublicIds.length;
            const newTotal = currentCount + files.length;
            const tier = req.user.subscriptionTier ?? "starter";
            const maxPhotos = subscriptionTiers_1.TIER_CONFIG[tier].maxPhotos;
            if (newTotal > maxPhotos) {
                throw new AppError_1.AppError(`Your ${subscriptionTiers_1.TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing. ` +
                    `You currently have ${currentCount} and are adding ${files.length}.`, 400);
            }
        }
        const property = await propertyService.updateProperty(req.params.id, req.body, req.user.id, removeImagePublicIds, files.length ? files : undefined);
        res.status(200).json({ status: "success", data: { property } });
    }),
    deleteProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await propertyService.deleteProperty(req.params.id, req.user.id);
        res.status(204).json({
            status: "success",
            data: null,
        });
    }),
    getBookedDates: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bookedDates = await propertyService.getBookedDates(req.params.id);
        res.json({ status: "success", data: { bookedDates } });
    }),
    updateBlockedDates: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { blockedDates } = req.body;
        if (!Array.isArray(blockedDates)) {
            res.status(400).json({ status: "error", message: "blockedDates must be an array" });
            return;
        }
        await propertyService.updateBlockedDates(req.params.id, req.user.id, blockedDates);
        res.json({ status: "success", data: null });
    }),
    /** POST /api/properties/:id/feature-video — upload a feature video (Pro/Elite) */
    uploadFeatureVideo: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const file = req.file;
        if (!file)
            throw new AppError_1.AppError("No video file uploaded", 400);
        const tier = req.user.subscriptionTier ?? "starter";
        const tierCfg = subscriptionTiers_1.TIER_CONFIG[tier];
        const maxSizeBytes = tierCfg.videoMaxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new AppError_1.AppError(`Video file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
                `Your ${tierCfg.label} plan allows up to ${tierCfg.videoMaxSizeMB} MB.`, 400);
        }
        // Verify the host owns this property
        const property = await propertyService.getPropertyById(req.params.id);
        if (property.hostId !== req.user.id && req.user.role !== "admin") {
            throw new AppError_1.AppError("You can only update your own listings", 403);
        }
        // Delete old video from Cloudinary if present
        if (property.featureVideoPublicId) {
            await cloudinaryService.deleteVideo(property.featureVideoPublicId).catch(() => { });
        }
        const uploaded = await cloudinaryService.uploadVideo(file, "listing-videos", tierCfg.videoMaxSeconds);
        const updated = await propertyService.updateProperty(property.id, {
            featureVideoUrl: uploaded.url,
            featureVideoPublicId: uploaded.publicId,
        }, req.user.id);
        res.json({ status: "success", data: { property: updated } });
    }),
    /** DELETE /api/properties/:id/feature-video — remove the feature video */
    deleteFeatureVideo: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const property = await propertyService.getPropertyById(req.params.id);
        if (property.hostId !== req.user.id && req.user.role !== "admin") {
            throw new AppError_1.AppError("You can only update your own listings", 403);
        }
        if (property.featureVideoPublicId) {
            await cloudinaryService.deleteVideo(property.featureVideoPublicId).catch(() => { });
        }
        await propertyService.updateProperty(property.id, { featureVideoUrl: null, featureVideoPublicId: null }, req.user.id);
        res.json({ status: "success", data: null });
    }),
};
//# sourceMappingURL=propertyController.js.map