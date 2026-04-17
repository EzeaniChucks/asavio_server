"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBookingController = void 0;
const eventBookingService_1 = require("../services/eventBookingService");
const catchAsync_1 = require("../utils/catchAsync");
exports.eventBookingController = {
    /** GET /event-bookings/slots?eventSpaceId=&eventDate= */
    getSlots: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { eventSpaceId, eventDate } = req.query;
        const slots = await eventBookingService_1.eventBookingService.getSlots(eventSpaceId, eventDate);
        res.json({ status: "success", data: { slots } });
    }),
    /** POST /event-bookings */
    create: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const booking = await eventBookingService_1.eventBookingService.createBooking(req.user.id, req.body);
        res.status(201).json({ status: "success", data: { booking } });
    }),
    /** GET /event-bookings/my */
    getMyBookings: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const bookings = await eventBookingService_1.eventBookingService.getUserBookings(req.user.id);
        res.json({ status: "success", data: { bookings } });
    }),
    /** GET /event-bookings/host */
    getHostBookings: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const bookings = await eventBookingService_1.eventBookingService.getHostBookings(req.user.id);
        res.json({ status: "success", data: { bookings } });
    }),
    /** GET /event-bookings/:id */
    getBooking: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const booking = await eventBookingService_1.eventBookingService.getById(req.params.id, req.user.id, req.user.role);
        res.json({ status: "success", data: { booking } });
    }),
    /** PATCH /event-bookings/:id/status */
    updateStatus: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const booking = await eventBookingService_1.eventBookingService.updateStatus(req.params.id, req.body.status, req.user.id, req.user.role, req.body.cancellationReason);
        res.json({ status: "success", data: { booking } });
    }),
};
//# sourceMappingURL=eventBookingController.js.map