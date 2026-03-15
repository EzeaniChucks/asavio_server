"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = void 0;
const adminService_1 = require("../services/adminService");
const catchAsync_1 = require("../utils/catchAsync");
exports.adminController = {
    getStats: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const stats = await adminService_1.adminService.getStats();
        res.json({ status: "success", data: { stats } });
    }),
    getUsers: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, role, search } = req.query;
        const result = await adminService_1.adminService.getUsers({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            role: role,
            search: search,
        });
        res.json({ status: "success", data: result });
    }),
    updateUser: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const user = await adminService_1.adminService.updateUser(req.params.id, req.body);
        res.json({ status: "success", data: { user } });
    }),
    deleteUser: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteUser(req.params.id);
        res.status(204).send();
    }),
    getProperties: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, search, status } = req.query;
        const result = await adminService_1.adminService.getProperties({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            search: search,
            status: status,
        });
        res.json({ status: "success", data: result });
    }),
    updateProperty: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const property = await adminService_1.adminService.updateProperty(req.params.id, req.body);
        res.json({ status: "success", data: { property } });
    }),
    deleteProperty: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteProperty(req.params.id);
        res.status(204).send();
    }),
    getVehicles: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, search } = req.query;
        const result = await adminService_1.adminService.getVehicles({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            search: search,
        });
        res.json({ status: "success", data: result });
    }),
    deleteVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteVehicle(req.params.id);
        res.status(204).send();
    }),
    getBookings: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { page, limit, status } = req.query;
        const result = await adminService_1.adminService.getBookings({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            status: status,
        });
        res.json({ status: "success", data: result });
    }),
    updateBookingStatus: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const booking = await adminService_1.adminService.updateBookingStatus(req.params.id, req.body.status);
        res.json({ status: "success", data: { booking } });
    }),
    deleteReview: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        await adminService_1.adminService.deleteReview(req.params.id);
        res.status(204).send();
    }),
    sendBroadcast: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const result = await adminService_1.adminService.sendBroadcast(req.body);
        res.json({ status: "success", data: result });
    }),
};
//# sourceMappingURL=adminController.js.map