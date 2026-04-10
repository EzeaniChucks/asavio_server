"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingController = void 0;
const bookingService_1 = require("../services/bookingService");
const catchAsync_1 = require("../utils/catchAsync");
const bookingService = new bookingService_1.BookingService();
exports.bookingController = {
    createBooking: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const booking = await bookingService.createBooking(req.user.id, req.body);
        res.status(201).json({
            status: "success",
            data: { booking },
        });
    }),
    getMyBookings: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bookings = await bookingService.getUserBookings(req.user.id);
        res.status(200).json({
            status: "success",
            results: bookings.length,
            data: { bookings },
        });
    }),
    getHostBookings: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bookings = await bookingService.getHostBookings(req.user.id);
        res.status(200).json({
            status: "success",
            results: bookings.length,
            data: { bookings },
        });
    }),
    getBooking: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const booking = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);
        res.status(200).json({
            status: "success",
            data: { booking },
        });
    }),
    updateBookingStatus: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const booking = await bookingService.updateBookingStatus(req.params.id, req.body.status, req.user.id, req.user.role, req.body.cancellationReason);
        res.status(200).json({
            status: "success",
            data: { booking },
        });
    }),
    getCancellationEstimate: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const estimate = await bookingService.getCancellationEstimate(req.params.id, req.user.id, req.user.role);
        res.json({ status: "success", data: estimate });
    }),
    checkAvailability: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { propertyId, checkIn, checkOut, purpose } = req.query;
        const result = await bookingService.checkAvailability(propertyId, checkIn, checkOut, purpose);
        res.status(200).json({ status: "success", data: result });
    }),
    checkVehicleAvailability: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { vehicleId, checkIn, checkOut, withDriver, travelScope } = req.query;
        const result = await bookingService.checkVehicleAvailability(vehicleId, checkIn, checkOut, withDriver === "true", travelScope);
        res.status(200).json({ status: "success", data: result });
    }),
    getVehicleBookedDates: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const bookedDates = await bookingService.getVehicleBookedDates(req.params.vehicleId);
        res.json({ status: "success", data: { bookedDates } });
    }),
};
//# sourceMappingURL=bookingController.js.map