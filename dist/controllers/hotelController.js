"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelController = void 0;
const hotelService_1 = require("../services/hotelService");
const settingsService_1 = require("../services/settingsService");
const bookingService_1 = require("../services/bookingService");
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
const bookingService = new bookingService_1.BookingService();
exports.hotelController = {
    // ── Public ──────────────────────────────────────────────────────────
    getAvailableHotelTypes: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const types = await hotelService_1.hotelService.getAvailableHotelTypes();
        res.json({ status: "success", data: { types } });
    }),
    getHotelTypeRepresentatives: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const hotels = await hotelService_1.hotelService.getHotelTypeRepresentatives();
        res.json({ status: "success", data: { hotels } });
    }),
    listHotels: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { city, hotelType, star, minPrice, maxPrice, guests, sort, page, limit } = req.query;
        const result = await hotelService_1.hotelService.getHotels({
            city: city,
            hotelType: hotelType,
            star: star ? Number(star) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            guests: guests ? Number(guests) : undefined,
            sort: sort,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 12,
        });
        res.json({ status: "success", data: result });
    }),
    getHotel: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const hotel = await hotelService_1.hotelService.getHotelById(req.params.id);
        res.json({ status: "success", data: { hotel } });
    }),
    /** GET /hotels/:id/rooms/:roomId/booked-dates — per-room booked ranges for calendar */
    getRoomBookedDates: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const bookedDates = await bookingService.getHotelRoomBookedDates(req.params.roomId);
        res.json({ status: "success", data: { bookedDates } });
    }),
    /** GET /hotels/:id/room-availability?checkIn=&checkOut= */
    getRoomAvailability: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { checkIn, checkOut } = req.query;
        if (!checkIn || !checkOut) {
            throw new AppError_1.AppError("checkIn and checkOut are required", 400);
        }
        const rooms = await hotelService_1.hotelService.getRoomAvailability(req.params.id, checkIn, checkOut);
        res.json({ status: "success", data: { rooms } });
    }),
    // ── Host/Admin: hotel CRUD ──────────────────────────────────────────
    createHotel: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        // Enforce photo limit per tier
        if (files.length > 0) {
            const tier = req.user.subscriptionTier ?? "starter";
            const tierConfig = await settingsService_1.settingsService.getActiveTierConfig();
            const { maxPhotos, label } = tierConfig[tier];
            if (files.length > maxPhotos) {
                throw new AppError_1.AppError(`Your ${label} plan allows up to ${maxPhotos} photos per listing.`, 400);
            }
        }
        // Parse JSON fields from multipart body
        const body = { ...req.body };
        if (typeof body.location === "string")
            body.location = JSON.parse(body.location);
        if (typeof body.amenities === "string")
            body.amenities = JSON.parse(body.amenities);
        if (typeof body.nearbyPlaces === "string")
            body.nearbyPlaces = JSON.parse(body.nearbyPlaces);
        const hotel = await hotelService_1.hotelService.createHotel(req.user.id, body, files);
        res.status(201).json({ status: "success", data: { hotel } });
    }),
    updateHotel: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        // Parse JSON fields
        const body = { ...req.body };
        if (typeof body.location === "string")
            body.location = JSON.parse(body.location);
        if (typeof body.amenities === "string")
            body.amenities = JSON.parse(body.amenities);
        if (typeof body.nearbyPlaces === "string")
            body.nearbyPlaces = JSON.parse(body.nearbyPlaces);
        const hotel = await hotelService_1.hotelService.updateHotel(req.params.id, req.user.id, req.user.role, body, files.length ? files : undefined);
        res.json({ status: "success", data: { hotel } });
    }),
    deleteHotel: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await hotelService_1.hotelService.deleteHotel(req.params.id, req.user.id, req.user.role);
        res.status(204).send();
    }),
    toggleAvailability: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const hotel = await hotelService_1.hotelService.toggleAvailability(req.params.id, req.user.id);
        res.json({ status: "success", data: { hotel } });
    }),
    getMyHotels: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const hotels = await hotelService_1.hotelService.getHostHotels(req.user.id);
        res.json({ status: "success", data: { hotels } });
    }),
    // ── Host/Admin: room type CRUD ──────────────────────────────────────
    createRoomType: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        const body = { ...req.body };
        if (typeof body.roomAmenities === "string")
            body.roomAmenities = JSON.parse(body.roomAmenities);
        const room = await hotelService_1.hotelService.createRoomType(req.params.id, req.user.id, req.user.role, body, files);
        res.status(201).json({ status: "success", data: { room } });
    }),
    updateRoomType: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
        const body = { ...req.body };
        if (typeof body.roomAmenities === "string")
            body.roomAmenities = JSON.parse(body.roomAmenities);
        const room = await hotelService_1.hotelService.updateRoomType(req.params.roomId, req.user.id, req.user.role, body, files.length ? files : undefined);
        res.json({ status: "success", data: { room } });
    }),
    deleteRoomType: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await hotelService_1.hotelService.deleteRoomType(req.params.roomId, req.user.id, req.user.role);
        res.status(204).send();
    }),
};
//# sourceMappingURL=hotelController.js.map