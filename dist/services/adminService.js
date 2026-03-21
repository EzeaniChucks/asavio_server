"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminService = void 0;
// src/services/adminService.ts
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Property_1 = require("../entities/Property");
const Vehicle_1 = require("../entities/Vehicle");
const Booking_1 = require("../entities/Booking");
const Review_1 = require("../entities/Review");
const AppError_1 = require("../utils/AppError");
const emailService_1 = require("./emailService");
class AdminService {
    // ── Stats ────────────────────────────────────────────────────
    async getStats() {
        const [totalUsers, totalHosts, totalProperties, totalVehicles, totalBookings, totalReviews, pendingBookings, revenueResult,] = await Promise.all([
            database_1.AppDataSource.getRepository(User_1.User).count({ where: { role: "user" } }),
            database_1.AppDataSource.getRepository(User_1.User).count({ where: { role: "host" } }),
            database_1.AppDataSource.getRepository(Property_1.Property).count({ where: { status: "approved" } }),
            database_1.AppDataSource.getRepository(Vehicle_1.Vehicle).count(),
            database_1.AppDataSource.getRepository(Booking_1.Booking).count(),
            database_1.AppDataSource.getRepository(Review_1.Review).count(),
            database_1.AppDataSource.getRepository(Booking_1.Booking).count({ where: { status: "awaiting_payment" } }),
            database_1.AppDataSource.getRepository(Booking_1.Booking)
                .createQueryBuilder("b")
                .select("SUM(b.totalPrice)", "total")
                .where("b.status IN (:...statuses)", { statuses: ["confirmed", "completed"] })
                .getRawOne(),
        ]);
        return {
            totalUsers,
            totalHosts,
            totalProperties,
            totalVehicles,
            totalBookings,
            totalReviews,
            pendingBookings,
            totalRevenue: Number(revenueResult?.total ?? 0),
            pendingListings: await database_1.AppDataSource.getRepository(Property_1.Property).count({ where: { status: "pending" } }),
        };
    }
    // ── Users ────────────────────────────────────────────────────
    async getUsers(opts) {
        const { page = 1, role, search } = opts;
        const limit = Math.min(opts.limit ?? 20, 100);
        const qb = database_1.AppDataSource.getRepository(User_1.User)
            .createQueryBuilder("u")
            .orderBy("u.createdAt", "DESC");
        if (role)
            qb.andWhere("u.role = :role", { role });
        if (search) {
            qb.andWhere("(LOWER(u.email) LIKE :q OR LOWER(u.firstName) LIKE :q OR LOWER(u.lastName) LIKE :q)", { q: `%${search.toLowerCase()}%` });
        }
        const total = await qb.getCount();
        const users = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        // Strip passwords
        return {
            users: users.map(({ password: _pw, ...u }) => u),
            total,
        };
    }
    async updateUser(id, updates) {
        const repo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await repo.findOne({ where: { id } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        // Guard against promoting to admin through API — only via DB directly
        if (updates.role === "admin")
            throw new AppError_1.AppError("Cannot set admin role via API", 403);
        Object.assign(user, updates);
        await repo.save(user);
        const { password: _pw, ...safe } = user;
        return safe;
    }
    async deleteUser(id) {
        const repo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await repo.findOne({ where: { id } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        if (user.role === "admin")
            throw new AppError_1.AppError("Cannot delete an admin account", 403);
        await repo.remove(user);
    }
    async getHostProperties(hostId) {
        const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: hostId } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const properties = await database_1.AppDataSource.getRepository(Property_1.Property).find({
            where: { hostId },
            relations: ["images"],
            order: { createdAt: "DESC" },
        });
        const { password: _pw, ...safeUser } = user;
        return { host: safeUser, properties };
    }
    // ── Properties ───────────────────────────────────────────────
    async getProperties(opts) {
        const { page = 1, search, status } = opts;
        const limit = Math.min(opts.limit ?? 20, 100);
        const qb = database_1.AppDataSource.getRepository(Property_1.Property)
            .createQueryBuilder("p")
            .leftJoinAndSelect("p.host", "host")
            .leftJoinAndSelect("p.images", "images")
            .orderBy("p.createdAt", "DESC");
        if (status) {
            qb.andWhere("p.status = :status", { status });
        }
        if (search) {
            qb.andWhere("(LOWER(p.title) LIKE :q OR LOWER(p.location->>'city') LIKE :q)", { q: `%${search.toLowerCase()}%` });
        }
        const total = await qb.getCount();
        const properties = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return { properties, total };
    }
    async updateProperty(id, updates) {
        const repo = database_1.AppDataSource.getRepository(Property_1.Property);
        const property = await repo.findOne({
            where: { id },
            relations: ["host"],
        });
        if (!property)
            throw new AppError_1.AppError("Property not found", 404);
        const prevStatus = property.status;
        Object.assign(property, updates);
        const saved = await repo.save(property);
        // Fire email when admin approves or rejects
        const newStatus = updates.status;
        if (newStatus && newStatus !== prevStatus && property.host) {
            emailService_1.emailService
                .sendListingStatusUpdate({
                to: property.host.email,
                hostName: property.host.firstName,
                propertyTitle: property.title,
                status: newStatus,
                rejectionReason: updates.rejectionReason,
                propertyId: id,
            })
                .catch(console.error);
        }
        return saved;
    }
    async deleteProperty(id) {
        const repo = database_1.AppDataSource.getRepository(Property_1.Property);
        const property = await repo.findOne({ where: { id } });
        if (!property)
            throw new AppError_1.AppError("Property not found", 404);
        await repo.remove(property);
    }
    // ── Vehicles ─────────────────────────────────────────────────
    async getVehicles(opts) {
        const { page = 1, search } = opts;
        const limit = Math.min(opts.limit ?? 20, 100);
        const qb = database_1.AppDataSource.getRepository(Vehicle_1.Vehicle)
            .createQueryBuilder("v")
            .leftJoinAndSelect("v.host", "host")
            .orderBy("v.createdAt", "DESC");
        if (search) {
            qb.andWhere("(LOWER(v.make) LIKE :q OR LOWER(v.model) LIKE :q OR LOWER(v.location) LIKE :q)", { q: `%${search.toLowerCase()}%` });
        }
        const total = await qb.getCount();
        const vehicles = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return { vehicles, total };
    }
    async deleteVehicle(id) {
        const repo = database_1.AppDataSource.getRepository(Vehicle_1.Vehicle);
        const vehicle = await repo.findOne({ where: { id } });
        if (!vehicle)
            throw new AppError_1.AppError("Vehicle not found", 404);
        await repo.remove(vehicle);
    }
    // ── Bookings ─────────────────────────────────────────────────
    async getBookings(opts) {
        const { page = 1, status } = opts;
        const limit = Math.min(opts.limit ?? 20, 100);
        const qb = database_1.AppDataSource.getRepository(Booking_1.Booking)
            .createQueryBuilder("b")
            .leftJoinAndSelect("b.user", "user")
            .leftJoinAndSelect("b.property", "property")
            .orderBy("b.createdAt", "DESC");
        if (status)
            qb.andWhere("b.status = :status", { status });
        const total = await qb.getCount();
        const bookings = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();
        return { bookings, total };
    }
    async updateBookingStatus(id, status) {
        const repo = database_1.AppDataSource.getRepository(Booking_1.Booking);
        const booking = await repo.findOne({
            where: { id },
            relations: ["user", "property"],
        });
        if (!booking)
            throw new AppError_1.AppError("Booking not found", 404);
        booking.status = status;
        const saved = await repo.save(booking);
        // Fire status email (best-effort)
        emailService_1.emailService
            .sendBookingStatusUpdate({
            to: booking.user.email,
            firstName: booking.user.firstName,
            propertyTitle: booking.property?.title ?? (`${booking.vehicle?.make ?? ""} ${booking.vehicle?.model ?? ""}`.trim() || "Booking"),
            status,
            bookingId: booking.id,
        })
            .catch(console.error);
        return saved;
    }
    // ── Reviews ──────────────────────────────────────────────────
    async deleteReview(id) {
        const repo = database_1.AppDataSource.getRepository(Review_1.Review);
        const review = await repo.findOne({ where: { id } });
        if (!review)
            throw new AppError_1.AppError("Review not found", 404);
        await repo.remove(review);
    }
    // ── Email broadcast ──────────────────────────────────────────
    async getAudienceRecipients(audience) {
        const repo = database_1.AppDataSource.getRepository(User_1.User);
        switch (audience) {
            case "users":
                return repo.find({ where: { role: "user" } });
            case "hosts":
                return repo.find({ where: { role: "host" } });
            case "verified_hosts":
                return repo.find({ where: { role: "host", kycStatus: "approved" } });
            case "unverified_hosts":
                return repo.createQueryBuilder("u")
                    .where("u.role = :role", { role: "host" })
                    .andWhere("u.kycStatus != :status", { status: "approved" })
                    .getMany();
            case "guests_with_bookings":
                return repo.createQueryBuilder("u")
                    .innerJoin("u.bookings", "b")
                    .where("u.role = :role", { role: "user" })
                    .distinct(true)
                    .getMany();
            default: // "all"
                return repo.createQueryBuilder("u")
                    .where("u.role != :role", { role: "admin" })
                    .getMany();
        }
    }
    async previewAudienceCount(audience) {
        const recipients = await this.getAudienceRecipients(audience);
        return { count: recipients.length };
    }
    async sendBroadcast(opts) {
        const { audience, subject, message, htmlBody } = opts;
        const recipients = await this.getAudienceRecipients(audience);
        const sends = recipients.map((u) => {
            if (htmlBody) {
                return emailService_1.emailService
                    .sendCampaign({ to: u.email, firstName: u.firstName, subject, htmlBody })
                    .catch(console.error);
            }
            return emailService_1.emailService
                .sendAdminBroadcast({ to: u.email, subject, message: message ?? "" })
                .catch(console.error);
        });
        await Promise.all(sends);
        return { sent: recipients.length };
    }
}
exports.adminService = new AdminService();
//# sourceMappingURL=adminService.js.map