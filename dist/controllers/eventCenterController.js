"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventCenterController = void 0;
const eventCenterService_1 = require("../services/eventCenterService");
const settingsService_1 = require("../services/settingsService");
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
exports.eventCenterController = {
    // ── Public ──────────────────────────────────────────────────────────
    listEventCenters: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { city, eventType, minCapacity, minPrice, maxPrice, sort, page, limit } = req.query;
        const result = await eventCenterService_1.eventCenterService.getAll({
            city: city,
            eventType: eventType,
            minCapacity: minCapacity ? Number(minCapacity) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort: sort,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 12,
        });
        res.json({ status: "success", data: result });
    }),
    getEventCenter: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const ec = await eventCenterService_1.eventCenterService.getById(req.params.id);
        res.json({ status: "success", data: { eventCenter: ec } });
    }),
    // ── Host/Admin: event center CRUD ───────────────────────────────────
    createEventCenter: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        if (files.length > 0) {
            const tier = req.user.subscriptionTier ?? "starter";
            const tierConfig = await settingsService_1.settingsService.getActiveTierConfig();
            const { maxPhotos, label } = tierConfig[tier];
            if (files.length > maxPhotos) {
                throw new AppError_1.AppError(`Your ${label} plan allows up to ${maxPhotos} photos per listing.`, 400);
            }
        }
        const body = { ...req.body };
        if (typeof body.location === "string")
            body.location = JSON.parse(body.location);
        if (typeof body.amenities === "string")
            body.amenities = JSON.parse(body.amenities);
        if (typeof body.nearbyPlaces === "string")
            body.nearbyPlaces = JSON.parse(body.nearbyPlaces);
        if (typeof body.allowedEventTypes === "string")
            body.allowedEventTypes = JSON.parse(body.allowedEventTypes);
        if (typeof body.blockedEventTypes === "string")
            body.blockedEventTypes = JSON.parse(body.blockedEventTypes);
        const ec = await eventCenterService_1.eventCenterService.createEventCenter(req.user.id, body, files);
        res.status(201).json({ status: "success", data: { eventCenter: ec } });
    }),
    updateEventCenter: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        const body = { ...req.body };
        if (typeof body.location === "string")
            body.location = JSON.parse(body.location);
        if (typeof body.amenities === "string")
            body.amenities = JSON.parse(body.amenities);
        if (typeof body.nearbyPlaces === "string")
            body.nearbyPlaces = JSON.parse(body.nearbyPlaces);
        if (typeof body.allowedEventTypes === "string")
            body.allowedEventTypes = JSON.parse(body.allowedEventTypes);
        if (typeof body.blockedEventTypes === "string")
            body.blockedEventTypes = JSON.parse(body.blockedEventTypes);
        const ec = await eventCenterService_1.eventCenterService.update(req.params.id, req.user.id, req.user.role, body, files.length ? files : undefined);
        res.json({ status: "success", data: { eventCenter: ec } });
    }),
    deleteEventCenter: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await eventCenterService_1.eventCenterService.deleteEventCenter(req.params.id, req.user.id, req.user.role);
        res.status(204).send();
    }),
    toggleAvailability: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const ec = await eventCenterService_1.eventCenterService.toggleAvailability(req.params.id, req.user.id);
        res.json({ status: "success", data: { eventCenter: ec } });
    }),
    getMyEventCenters: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const ecs = await eventCenterService_1.eventCenterService.getHostEventCenters(req.user.id);
        res.json({ status: "success", data: { eventCenters: ecs } });
    }),
    // ── Spaces ──────────────────────────────────────────────────────────
    createSpace: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        const body = { ...req.body };
        const space = await eventCenterService_1.eventCenterService.createSpace(req.params.id, req.user.id, req.user.role, body, files);
        res.status(201).json({ status: "success", data: { space } });
    }),
    updateSpace: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        const space = await eventCenterService_1.eventCenterService.updateSpace(req.params.spaceId, req.user.id, req.user.role, req.body, files.length ? files : undefined);
        res.json({ status: "success", data: { space } });
    }),
    deleteSpace: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await eventCenterService_1.eventCenterService.deleteSpace(req.params.spaceId, req.user.id, req.user.role);
        res.status(204).send();
    }),
};
//# sourceMappingURL=eventCenterController.js.map