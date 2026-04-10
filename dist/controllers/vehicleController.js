"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleController = void 0;
const vehicleService_1 = require("../services/vehicleService");
const cloudinaryService_1 = require("../services/cloudinaryService");
const subscriptionService_1 = require("../services/subscriptionService");
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const subscriptionTiers_1 = require("../constants/subscriptionTiers");
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
exports.vehicleController = {
    getAvailableVehicleTypes: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const types = await vehicleService_1.vehicleService.getAvailableVehicleTypes();
        res.status(200).json({ status: "success", data: { types } });
    }),
    getVehicleTypeRepresentatives: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const vehicles = await vehicleService_1.vehicleService.getVehicleTypeRepresentatives();
        res.status(200).json({ status: "success", data: { vehicles } });
    }),
    listVehicles: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { vehicleType, minPrice, maxPrice, withDriver, location, seats, sort, page, limit } = req.query;
        const result = await vehicleService_1.vehicleService.getVehicles({
            vehicleType: vehicleType,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            withDriver: withDriver !== undefined ? withDriver === "true" : undefined,
            location: location,
            seats: seats ? Number(seats) : undefined,
            sort: sort,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 12,
        });
        res.json({ status: "success", data: result });
    }),
    getVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const vehicle = await vehicleService_1.vehicleService.getVehicleById(req.params.id);
        res.json({ status: "success", data: { vehicle } });
    }),
    createVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        // Check listing limit
        await subscriptionService_1.subscriptionService.checkListingLimit(req.user.id, "vehicle");
        const files = req.files ?? [];
        // Enforce photo limit
        if (files.length > 0) {
            const tier = req.user.subscriptionTier ?? "starter";
            const maxPhotos = subscriptionTiers_1.TIER_CONFIG[tier].maxPhotos;
            if (files.length > maxPhotos) {
                throw new AppError_1.AppError(`Your ${subscriptionTiers_1.TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing.`, 400);
            }
        }
        const vehicle = await vehicleService_1.vehicleService.createVehicle(req.user.id, req.body, files);
        res.status(201).json({ status: "success", data: { vehicle } });
    }),
    updateVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        // Enforce photo limit on update
        if (files.length > 0) {
            const existing = await vehicleService_1.vehicleService.getVehicleById(req.params.id);
            const removePublicIds = Array.isArray(req.body.removeImagePublicIds)
                ? req.body.removeImagePublicIds
                : req.body.removeImagePublicIds ? [req.body.removeImagePublicIds] : [];
            const currentCount = (existing.images?.length ?? 0) - removePublicIds.length;
            const newTotal = currentCount + files.length;
            const tier = req.user.subscriptionTier ?? "starter";
            const maxPhotos = subscriptionTiers_1.TIER_CONFIG[tier].maxPhotos;
            if (newTotal > maxPhotos) {
                throw new AppError_1.AppError(`Your ${subscriptionTiers_1.TIER_CONFIG[tier].label} plan allows up to ${maxPhotos} photos per listing.`, 400);
            }
        }
        const vehicle = await vehicleService_1.vehicleService.updateVehicle(req.params.id, req.user.id, req.user.role, req.body, files.length ? files : undefined);
        res.json({ status: "success", data: { vehicle } });
    }),
    deleteVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await vehicleService_1.vehicleService.deleteVehicle(req.params.id, req.user.id, req.user.role);
        res.status(204).send();
    }),
    toggleAvailability: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const vehicle = await vehicleService_1.vehicleService.toggleAvailability(req.params.id, req.user.id);
        res.json({ status: "success", data: { vehicle } });
    }),
    getMyVehicles: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const vehicles = await vehicleService_1.vehicleService.getHostVehicles(req.user.id);
        res.json({ status: "success", data: { vehicles } });
    }),
    /** GET /api/vehicles/:id/booked-dates — booked + blocked ranges for calendar display */
    getBookedDates: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const bookedDates = await vehicleService_1.vehicleService.getBookedDates(req.params.id);
        res.json({ status: "success", data: { bookedDates } });
    }),
    /** PATCH /api/vehicles/:id/blocked-dates — host/admin sets manual unavailability */
    updateBlockedDates: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { blockedDates } = req.body;
        if (!Array.isArray(blockedDates)) {
            res.status(400).json({ status: "error", message: "blockedDates must be an array" });
            return;
        }
        await vehicleService_1.vehicleService.updateBlockedDates(req.params.id, req.user.id, req.user.role, blockedDates);
        res.json({ status: "success", data: null });
    }),
    /** POST /api/vehicles/:id/feature-video — upload a feature video (Pro/Elite) */
    uploadFeatureVideo: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
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
        const vehicle = await vehicleService_1.vehicleService.getVehicleById(req.params.id);
        if (vehicle.hostId !== req.user.id && req.user.role !== "admin") {
            throw new AppError_1.AppError("You can only update your own listings", 403);
        }
        // Delete old video from Cloudinary if present
        if (vehicle.featureVideoPublicId) {
            await cloudinaryService.deleteVideo(vehicle.featureVideoPublicId).catch(() => { });
        }
        const uploaded = await cloudinaryService.uploadVideo(file, "listing-videos", tierCfg.videoMaxSeconds);
        const updated = await vehicleService_1.vehicleService.updateVehicle(vehicle.id, req.user.id, req.user.role, { featureVideoUrl: uploaded.url, featureVideoPublicId: uploaded.publicId });
        res.json({ status: "success", data: { vehicle: updated } });
    }),
    /** DELETE /api/vehicles/:id/feature-video — remove the feature video */
    deleteFeatureVideo: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const vehicle = await vehicleService_1.vehicleService.getVehicleById(req.params.id);
        if (vehicle.hostId !== req.user.id && req.user.role !== "admin") {
            throw new AppError_1.AppError("You can only update your own listings", 403);
        }
        if (vehicle.featureVideoPublicId) {
            await cloudinaryService.deleteVideo(vehicle.featureVideoPublicId).catch(() => { });
        }
        const updated = await vehicleService_1.vehicleService.updateVehicle(vehicle.id, req.user.id, req.user.role, { featureVideoUrl: null, featureVideoPublicId: null });
        res.json({ status: "success", data: { vehicle: updated } });
    }),
};
//# sourceMappingURL=vehicleController.js.map