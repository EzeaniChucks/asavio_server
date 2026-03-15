"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
// src/services/bookingService.ts
const database_1 = require("../config/database");
const Booking_1 = require("../entities/Booking");
const Property_1 = require("../entities/Property");
const User_1 = require("../entities/User");
const AppError_1 = require("../utils/AppError");
const emailService_1 = require("./emailService");
class BookingService {
    constructor() {
        this.bookingRepo = database_1.AppDataSource.getRepository(Booking_1.Booking);
        this.propertyRepo = database_1.AppDataSource.getRepository(Property_1.Property);
    }
    // ── Helpers ──────────────────────────────────────────────────────────────
    nightsBetween(checkIn, checkOut) {
        const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.ceil(ms / (1000 * 60 * 60 * 24));
    }
    /** Returns true when the property has a conflicting confirmed/pending booking */
    async hasConflict(propertyId, checkIn, checkOut, excludeBookingId) {
        const qb = this.bookingRepo
            .createQueryBuilder("booking")
            .where("booking.propertyId = :propertyId", { propertyId })
            .andWhere("booking.status IN (:...statuses)", {
            statuses: ["pending", "confirmed"],
        })
            // Overlap: existing starts before our end AND existing ends after our start
            .andWhere("booking.checkIn < :checkOut", { checkOut })
            .andWhere("booking.checkOut > :checkIn", { checkIn });
        if (excludeBookingId) {
            qb.andWhere("booking.id != :excludeBookingId", { excludeBookingId });
        }
        const count = await qb.getCount();
        return count > 0;
    }
    // ── Create ────────────────────────────────────────────────────────────────
    async createBooking(userId, input) {
        const { propertyId, checkIn: checkInStr, checkOut: checkOutStr, guests, specialRequests } = input;
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
        if (!property)
            throw new AppError_1.AppError("Property not found", 404);
        if (!property.isAvailable)
            throw new AppError_1.AppError("This property is not available for booking", 400);
        if (guests > property.maxGuests) {
            throw new AppError_1.AppError(`This property accommodates up to ${property.maxGuests} guests`, 400);
        }
        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        if (await this.hasConflict(propertyId, checkIn, checkOut)) {
            throw new AppError_1.AppError("These dates are not available — please choose different dates", 409);
        }
        const nights = this.nightsBetween(checkIn, checkOut);
        const totalPrice = Number(property.pricePerNight) * nights;
        const booking = this.bookingRepo.create({
            userId,
            propertyId,
            checkIn,
            checkOut,
            guests,
            totalPrice,
            specialRequests,
            status: "pending",
        });
        const saved = await this.bookingRepo.save(booking);
        const full = await this.getBookingById(saved.id, userId);
        // Fire-and-forget email notifications
        const guest = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: userId } });
        const host = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: property.hostId } });
        if (guest) {
            emailService_1.emailService.sendBookingConfirmation({
                to: guest.email,
                firstName: guest.firstName,
                propertyTitle: property.title,
                checkIn: new Date(checkIn).toLocaleDateString("en-GB"),
                checkOut: new Date(checkOut).toLocaleDateString("en-GB"),
                nights,
                totalPrice,
                bookingId: saved.id,
            }).catch(console.error);
        }
        if (host) {
            emailService_1.emailService.sendHostNewBooking({
                to: host.email,
                hostName: host.firstName,
                guestName: guest ? `${guest.firstName} ${guest.lastName}` : "A guest",
                propertyTitle: property.title,
                checkIn: new Date(checkIn).toLocaleDateString("en-GB"),
                checkOut: new Date(checkOut).toLocaleDateString("en-GB"),
                guests,
                bookingId: saved.id,
            }).catch(console.error);
        }
        return full;
    }
    // ── Read ──────────────────────────────────────────────────────────────────
    async getBookingById(id, requesterId, requesterRole = "user") {
        const booking = await this.bookingRepo.findOne({
            where: { id },
            relations: ["property", "property.images", "user"],
        });
        if (!booking)
            throw new AppError_1.AppError("Booking not found", 404);
        // Only the guest, the property host, or an admin may view
        const isGuest = booking.userId === requesterId;
        const isHost = booking.property?.hostId === requesterId;
        const isAdmin = requesterRole === "admin";
        if (!isGuest && !isHost && !isAdmin) {
            throw new AppError_1.AppError("You do not have access to this booking", 403);
        }
        return booking;
    }
    async getUserBookings(userId) {
        return this.bookingRepo.find({
            where: { userId },
            relations: ["property", "property.images"],
            order: { createdAt: "DESC" },
        });
    }
    async getHostBookings(hostId) {
        return this.bookingRepo
            .createQueryBuilder("booking")
            .innerJoinAndSelect("booking.property", "property")
            .leftJoinAndSelect("property.images", "images")
            .innerJoinAndSelect("booking.user", "user")
            .where("property.hostId = :hostId", { hostId })
            .orderBy("booking.createdAt", "DESC")
            .getMany();
    }
    // ── Update ────────────────────────────────────────────────────────────────
    async updateBookingStatus(id, status, requesterId, requesterRole) {
        const booking = await this.getBookingById(id, requesterId, requesterRole);
        // Only host/admin can confirm or complete; user can only cancel
        const isHost = booking.property?.hostId === requesterId;
        const isAdmin = requesterRole === "admin";
        const isGuest = booking.userId === requesterId;
        if (status === "confirmed" || status === "completed") {
            if (!isHost && !isAdmin) {
                throw new AppError_1.AppError("Only the host or admin can confirm or complete bookings", 403);
            }
        }
        if (status === "cancelled") {
            if (!isGuest && !isHost && !isAdmin) {
                throw new AppError_1.AppError("You do not have permission to cancel this booking", 403);
            }
            if (booking.status === "completed") {
                throw new AppError_1.AppError("Completed bookings cannot be cancelled", 400);
            }
        }
        await this.bookingRepo.update(id, { status });
        const updated = await this.bookingRepo.findOne({
            where: { id },
            relations: ["property", "property.images", "user"],
        });
        // Notify guest of status change (best-effort)
        if (updated?.user) {
            emailService_1.emailService.sendBookingStatusUpdate({
                to: updated.user.email,
                firstName: updated.user.firstName,
                propertyTitle: updated.property?.title ?? "your property",
                status,
                bookingId: id,
            }).catch(console.error);
        }
        return updated;
    }
    // ── Check availability (public helper) ───────────────────────────────────
    async checkAvailability(propertyId, checkIn, checkOut) {
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
        if (!property)
            throw new AppError_1.AppError("Property not found", 404);
        const conflict = await this.hasConflict(propertyId, new Date(checkIn), new Date(checkOut));
        return {
            available: property.isAvailable && !conflict,
            pricePerNight: property.pricePerNight,
            nights: this.nightsBetween(new Date(checkIn), new Date(checkOut)),
            totalPrice: conflict ? 0 : Number(property.pricePerNight) * this.nightsBetween(new Date(checkIn), new Date(checkOut)),
        };
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=bookingService.js.map