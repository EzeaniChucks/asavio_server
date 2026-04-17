"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = void 0;
const reviewService_1 = require("../services/reviewService");
const catchAsync_1 = require("../utils/catchAsync");
exports.reviewController = {
    createReview: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const review = await reviewService_1.reviewService.createReview(req.user.id, req.body);
        res.status(201).json({ status: "success", data: { review } });
    }),
    getPropertyReviews: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const reviews = await reviewService_1.reviewService.getPropertyReviews(req.params.propertyId);
        res.json({ status: "success", data: { reviews } });
    }),
    getVehicleReviews: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const reviews = await reviewService_1.reviewService.getVehicleReviews(req.params.vehicleId);
        res.json({ status: "success", data: { reviews } });
    }),
    getHotelReviews: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const reviews = await reviewService_1.reviewService.getHotelReviews(req.params.hotelId);
        res.json({ status: "success", data: { reviews } });
    }),
    getEventCenterReviews: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const reviews = await reviewService_1.reviewService.getEventCenterReviews(req.params.eventCenterId);
        res.json({ status: "success", data: { reviews } });
    }),
    getAllReviews: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const page = req.query.page ? Number(req.query.page) : 1;
        const limit = req.query.limit ? Number(req.query.limit) : 20;
        const result = await reviewService_1.reviewService.getAllReviews(page, limit);
        res.json({ status: "success", data: result });
    }),
    updateReview: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const review = await reviewService_1.reviewService.updateReview(req.params.id, req.user.id, req.user.role, req.body);
        res.json({ status: "success", data: { review } });
    }),
    deleteReview: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await reviewService_1.reviewService.deleteReview(req.params.id, req.user.id, req.user.role);
        res.status(204).send();
    }),
};
//# sourceMappingURL=reviewController.js.map