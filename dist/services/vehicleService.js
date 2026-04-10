"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleService = void 0;
// src/services/vehicleService.ts
const database_1 = require("../config/database");
const Vehicle_1 = require("../entities/Vehicle");
const Booking_1 = require("../entities/Booking");
const AppError_1 = require("../utils/AppError");
const cloudinaryService_1 = require("./cloudinaryService");
const typeorm_1 = require("typeorm");
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
class VehicleService {
    get repo() {
        return database_1.AppDataSource.getRepository(Vehicle_1.Vehicle);
    }
    async createVehicle(hostId, input, files) {
        const uploadedImages = [];
        for (const file of files) {
            const result = await cloudinaryService.uploadImage(file, "vehicles");
            uploadedImages.push(result);
        }
        const vehicle = this.repo.create({
            ...input,
            year: Number(input.year),
            pricePerDay: Number(input.pricePerDay),
            priceWithDriverPerDay: input.priceWithDriverPerDay != null ? Number(input.priceWithDriverPerDay) : null,
            cautionFee: input.cautionFee === "" || input.cautionFee == null ? null : Number(input.cautionFee),
            seats: Number(input.seats),
            withDriver: input.withDriver ?? false,
            status: "pending",
            isAvailable: false,
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
            .andWhere("vehicle.status = :status", { status: "approved" })
            .orderBy("vehicle.vehicleType", "ASC")
            .getRawMany();
        return rows.map((r) => r.type);
    }
    // Returns one representative vehicle (best-rated) per available type
    async getVehicleTypeRepresentatives() {
        const rows = await database_1.AppDataSource.query(`
      SELECT DISTINCT ON (LOWER(v."vehicleType")) v.id
      FROM vehicles v
      INNER JOIN users host ON host.id = v."hostId"
      WHERE v."isAvailable" = true AND v."status" = 'approved'
        AND host."kycStatus" = 'approved'
      ORDER BY LOWER(v."vehicleType"), v."averageRating" DESC, v."createdAt" DESC
    `);
        if (!rows.length)
            return [];
        const ids = rows.map((r) => r.id);
        const vehicles = await this.repo.find({
            where: { id: (0, typeorm_1.In)(ids) },
            relations: ["host"],
        });
        // Preserve DISTINCT ON ordering
        return ids.map((id) => vehicles.find((v) => v.id === id)).filter(Boolean);
    }
    async getVehicles(filters = {}) {
        const { vehicleType, minPrice, maxPrice, withDriver, location, seats, sort = "newest", page = 1, limit = 12, } = filters;
        const qb = this.repo
            .createQueryBuilder("v")
            .innerJoinAndSelect("v.host", "host")
            .where("v.isAvailable = :avail", { avail: true })
            .andWhere("v.status = :vstatus", { vstatus: "approved" })
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
                qb.orderBy("RANDOM()");
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
        // Remove specific images if requested
        let currentImages = [...(vehicle.images ?? [])];
        const toRemove = updates.removeImagePublicIds;
        if (toRemove) {
            const removeSet = Array.isArray(toRemove) ? toRemove : [toRemove];
            for (const pubId of removeSet) {
                await cloudinaryService.deleteImage(pubId).catch(() => null);
            }
            currentImages = currentImages.filter((img) => !removeSet.includes(img.publicId));
            vehicle.images = currentImages;
        }
        // Upload new images if provided, appending to current set
        if (files && files.length > 0) {
            const uploadedImages = [];
            for (const file of files) {
                const result = await cloudinaryService.uploadImage(file, "vehicles");
                uploadedImages.push(result);
            }
            vehicle.images = [...currentImages, ...uploadedImages];
        }
        // Strip removeImagePublicIds before applying remaining field updates
        const { removeImagePublicIds: _r, ...cleanUpdates } = updates;
        if ("cautionFee" in cleanUpdates) {
            cleanUpdates.cautionFee = cleanUpdates.cautionFee === "" || cleanUpdates.cautionFee == null
                ? null
                : Number(cleanUpdates.cautionFee);
        }
        Object.assign(vehicle, cleanUpdates);
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
    /**
     * Returns all booked date ranges (confirmed/awaiting_payment) PLUS host-blocked
     * date ranges for a given vehicle, combined into a single list for calendar display.
     */
    async getBookedDates(vehicleId) {
        const bookingRepo = database_1.AppDataSource.getRepository(Booking_1.Booking);
        // Cut-off: awaiting_payment bookings older than 45 min with no payment are abandoned.
        const cutoff = new Date(Date.now() - 45 * 60 * 1000);
        const [bookings, vehicle] = await Promise.all([
            bookingRepo
                .createQueryBuilder("b")
                .select(["b.checkIn", "b.checkOut"])
                .where("b.vehicleId = :vehicleId", { vehicleId })
                .andWhere("b.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
                .andWhere("(b.status = 'confirmed' OR b.paymentStatus = 'paid' OR b.paystackReference IS NOT NULL OR b.createdAt > :cutoff)", { cutoff })
                .getMany(),
            this.repo.findOne({ where: { id: vehicleId }, select: ["id", "blockedDates"] }),
        ]);
        const booked = bookings.map((b) => ({
            checkIn: String(b.checkIn).split("T")[0],
            checkOut: String(b.checkOut).split("T")[0],
        }));
        const blocked = (vehicle?.blockedDates ?? []).map((r) => ({
            checkIn: r.from,
            checkOut: r.to,
        }));
        return [...booked, ...blocked];
    }
    /** Host/admin: replace the full blockedDates array for a vehicle */
    async updateBlockedDates(vehicleId, hostId, role, blockedDates) {
        const vehicle = await this.getVehicleById(vehicleId);
        if (role !== "admin" && vehicle.hostId !== hostId) {
            throw new AppError_1.AppError("Not authorised to update this vehicle", 403);
        }
        await this.repo.update(vehicleId, { blockedDates });
    }
}
exports.vehicleService = new VehicleService();
//# sourceMappingURL=vehicleService.js.map