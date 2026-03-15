"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleController = void 0;
const vehicleService_1 = require("../services/vehicleService");
const catchAsync_1 = require("../utils/catchAsync");
exports.vehicleController = {
    getAvailableVehicleTypes: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const types = await vehicleService_1.vehicleService.getAvailableVehicleTypes();
        res.status(200).json({ status: "success", data: { types } });
    }),
    listVehicles: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const { vehicleType, minPrice, maxPrice, withDriver, location, seats, sort, page, limit, } = req.query;
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
        const files = req.files ?? [];
        const vehicle = await vehicleService_1.vehicleService.createVehicle(req.user.id, req.body, files);
        res.status(201).json({ status: "success", data: { vehicle } });
    }),
    updateVehicle: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const files = req.files ?? [];
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
};
//# sourceMappingURL=vehicleController.js.map