"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleService = void 0;
// src/services/vehicleService.ts
const database_1 = require("../config/database");
const Vehicle_1 = require("../entities/Vehicle");
const AppError_1 = require("../utils/AppError");
const cloudinaryService_1 = require("./cloudinaryService");
const fs = __importStar(require("fs"));
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
class VehicleService {
    get repo() {
        return database_1.AppDataSource.getRepository(Vehicle_1.Vehicle);
    }
    async createVehicle(hostId, input, files) {
        const uploadedImages = [];
        for (const file of files) {
            try {
                const result = await cloudinaryService.uploadImage(file, "vehicles");
                uploadedImages.push(result);
            }
            finally {
                if (fs.existsSync(file.path))
                    fs.unlinkSync(file.path);
            }
        }
        const vehicle = this.repo.create({
            ...input,
            year: Number(input.year),
            pricePerDay: Number(input.pricePerDay),
            priceWithDriverPerDay: input.priceWithDriverPerDay != null ? Number(input.priceWithDriverPerDay) : null,
            seats: Number(input.seats),
            withDriver: input.withDriver ?? false,
            features: input.features ?? [],
            images: uploadedImages,
            hostId,
        });
        return this.repo.save(vehicle);
    }
    async getAvailableVehicleTypes() {
        const rows = await database_1.AppDataSource.getRepository(Vehicle_1.Vehicle)
            .createQueryBuilder("vehicle")
            .select("DISTINCT vehicle.vehicleType", "type")
            .where("vehicle.isAvailable = :isAvailable", { isAvailable: true })
            .orderBy("vehicle.vehicleType", "ASC")
            .getRawMany();
        return rows.map((r) => r.type);
    }
    async getVehicles(filters = {}) {
        const { vehicleType, minPrice, maxPrice, withDriver, location, seats, sort = "newest", page = 1, limit = 12, } = filters;
        const qb = this.repo
            .createQueryBuilder("v")
            .innerJoinAndSelect("v.host", "host")
            .where("v.isAvailable = :avail", { avail: true })
            .andWhere("host.kycStatus = :kycStatus", { kycStatus: "approved" });
        if (vehicleType)
            qb.andWhere("v.vehicleType = :vehicleType", { vehicleType });
        if (minPrice !== undefined)
            qb.andWhere("v.pricePerDay >= :minPrice", { minPrice });
        if (maxPrice !== undefined)
            qb.andWhere("v.pricePerDay <= :maxPrice", { maxPrice });
        if (withDriver !== undefined)
            qb.andWhere("v.withDriver = :withDriver", { withDriver });
        if (location)
            qb.andWhere("LOWER(v.location) LIKE :loc", { loc: `%${location.toLowerCase()}%` });
        if (seats !== undefined)
            qb.andWhere("v.seats >= :seats", { seats });
        switch (sort) {
            case "price_asc":
                qb.orderBy("v.pricePerDay", "ASC");
                break;
            case "price_desc":
                qb.orderBy("v.pricePerDay", "DESC");
                break;
            case "rating":
                qb.orderBy("v.averageRating", "DESC");
                break;
            default:
                qb.orderBy("v.createdAt", "DESC");
        }
        const total = await qb.getCount();
        const vehicles = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return { vehicles, total };
    }
    async getVehicleById(id) {
        const vehicle = await this.repo.findOne({
            where: { id },
            relations: ["host"],
        });
        if (!vehicle)
            throw new AppError_1.AppError("Vehicle not found", 404);
        return vehicle;
    }
    async getHostVehicles(hostId) {
        return this.repo.find({
            where: { hostId },
            order: { createdAt: "DESC" },
        });
    }
    async updateVehicle(id, hostId, role, updates, files) {
        const vehicle = await this.getVehicleById(id);
        if (role !== "admin" && vehicle.hostId !== hostId) {
            throw new AppError_1.AppError("Not authorised to update this vehicle", 403);
        }
        if (files && files.length > 0) {
            const uploadedImages = [];
            for (const file of files) {
                try {
                    const result = await cloudinaryService.uploadImage(file, "vehicles");
                    uploadedImages.push(result);
                }
                finally {
                    if (fs.existsSync(file.path))
                        fs.unlinkSync(file.path);
                }
            }
            for (const img of vehicle.images) {
                if (img.publicId)
                    await cloudinaryService.deleteImage(img.publicId).catch(() => null);
            }
            vehicle.images = uploadedImages;
        }
        Object.assign(vehicle, updates);
        return this.repo.save(vehicle);
    }
    async deleteVehicle(id, hostId, role) {
        const vehicle = await this.getVehicleById(id);
        if (role !== "admin" && vehicle.hostId !== hostId) {
            throw new AppError_1.AppError("Not authorised to delete this vehicle", 403);
        }
        for (const img of vehicle.images) {
            if (img.publicId)
                await cloudinaryService.deleteImage(img.publicId).catch(() => null);
        }
        await this.repo.remove(vehicle);
    }
    async toggleAvailability(id, hostId) {
        const vehicle = await this.getVehicleById(id);
        if (vehicle.hostId !== hostId)
            throw new AppError_1.AppError("Not authorised", 403);
        vehicle.isAvailable = !vehicle.isAvailable;
        return this.repo.save(vehicle);
    }
}
exports.vehicleService = new VehicleService();
//# sourceMappingURL=vehicleService.js.map