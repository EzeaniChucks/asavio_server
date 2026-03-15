"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyController = void 0;
const propertyService_1 = require("../services/propertyService");
const cloudinaryService_1 = require("../services/cloudinaryService");
const catchAsync_1 = require("../utils/catchAsync");
const propertyService = new propertyService_1.PropertyService();
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
exports.propertyController = {
    createProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const files = req.files;
        let uploadedImages = [];
        if (files && files.length > 0) {
            uploadedImages = await cloudinaryService.uploadMultipleImages(files, "properties");
        }
        const property = await propertyService.createProperty(req.body, req.user.id, uploadedImages);
        res.status(201).json({
            status: "success",
            data: { property },
        });
    }),
    getProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const property = await propertyService.getPropertyById(req.params.id);
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
    updateProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const property = await propertyService.updateProperty(req.params.id, req.body, req.user.id);
        res.status(200).json({
            status: "success",
            data: { property },
        });
    }),
    deleteProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await propertyService.deleteProperty(req.params.id, req.user.id);
        res.status(204).json({
            status: "success",
            data: null,
        });
    }),
};
//# sourceMappingURL=propertyController.js.map