"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyController = void 0;
// src/controllers/propertyController.ts
const fs_1 = __importDefault(require("fs"));
const propertyService_1 = require("../services/propertyService");
const cloudinaryService_1 = require("../services/cloudinaryService");
const emailService_1 = require("../services/emailService");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const catchAsync_1 = require("../utils/catchAsync");
const propertyService = new propertyService_1.PropertyService();
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
exports.propertyController = {
    createProperty: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const files = req.files;
        let uploadedImages = [];
        try {
            if (files && files.length > 0) {
                uploadedImages = await cloudinaryService.uploadMultipleImages(files, "properties");
            }
        }
        finally {
            // Clean up temp files regardless of Cloudinary success/failure
            for (const file of files ?? []) {
                if (file.path && fs_1.default.existsSync(file.path))
                    fs_1.default.unlinkSync(file.path);
            }
        }
        const property = await propertyService.createProperty(req.body, req.user.id, uploadedImages);
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
};
//# sourceMappingURL=propertyController.js.map