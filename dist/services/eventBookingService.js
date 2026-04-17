"use strict";
// src/services/eventBookingService.ts
// Time-slot based booking for event centers.
// Key difference from property/vehicle/hotel bookings:
//   - Single date (not a date range)
//   - Start + end times within that day
//   - Setup/teardown buffers factor into overlap detection
//   - "daily" pricing mode locks the entire day
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBookingService = void 0;
const database_1 = require("../config/database");
const EventBooking_1 = require("../entities/EventBooking");
const EventCenter_1 = require("../entities/EventCenter");
const EventSpace_1 = require("../entities/EventSpace");
const User_1 = require("../entities/User");
const AppError_1 = require("../utils/AppError");
const settingsService_1 = require("./settingsService");
const emailService_1 = require("./emailService");
const notificationService_1 = require("./notificationService");
/** Converts "HH:MM" to total minutes since midnight */
function toMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
}
class EventBookingService {
    get repo() { return database_1.AppDataSource.getRepository(EventBooking_1.EventBooking); }
    // ── Availability ──────────────────────────────────────────────────────
    /**
     * Returns booked time slots for a specific space on a given date.
     * Used by the frontend to grey out unavailable hours.
     */
    async getSlots(eventSpaceId, eventDate) {
        const cutoff = new Date(Date.now() - 45 * 60 * 1000);
        const bookings = await this.repo
            .createQueryBuilder("eb")
            .select(["eb.startTime", "eb.endTime", "eb.status"])
            .where("eb.eventSpaceId = :eventSpaceId", { eventSpaceId })
            .andWhere("eb.eventDate = :eventDate", { eventDate })
            .andWhere("eb.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
            .andWhere("(eb.status = 'confirmed' OR eb.paymentStatus = 'paid' OR eb.paystackReference IS NOT NULL OR eb.createdAt > :cutoff)", { cutoff })
            .getMany();
        return bookings.map((b) => ({
            startTime: String(b.startTime),
            endTime: String(b.endTime),
            status: b.status,
        }));
    }
    /**
     * Checks if a proposed slot overlaps with any existing booking.
     * Includes setup + teardown buffers.
     * For daily-mode spaces, any booking on the date = conflict.
     */
    async hasConflict(space, eventDate, startTime, endTime, excludeBookingId) {
        const cutoff = new Date(Date.now() - 45 * 60 * 1000);
        // For daily pricing, any existing booking locks the whole day
        if (space.pricingMode === "daily") {
            const qb = this.repo
                .createQueryBuilder("eb")
                .where("eb.eventSpaceId = :sid", { sid: space.id })
                .andWhere("eb.eventDate = :eventDate", { eventDate })
                .andWhere("eb.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
                .andWhere("(eb.status = 'confirmed' OR eb.paymentStatus = 'paid' OR eb.paystackReference IS NOT NULL OR eb.createdAt > :cutoff)", { cutoff });
            if (excludeBookingId)
                qb.andWhere("eb.id != :exId", { exId: excludeBookingId });
            return (await qb.getCount()) > 0;
        }
        // Hourly / package / hybrid — check time overlap with buffers
        const proposedStart = toMinutes(startTime) - space.setupMinutes;
        const proposedEnd = toMinutes(endTime) + space.teardownMinutes;
        const qb = this.repo
            .createQueryBuilder("eb")
            .where("eb.eventSpaceId = :sid", { sid: space.id })
            .andWhere("eb.eventDate = :eventDate", { eventDate })
            .andWhere("eb.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
            .andWhere("(eb.status = 'confirmed' OR eb.paymentStatus = 'paid' OR eb.paystackReference IS NOT NULL OR eb.createdAt > :cutoff)", { cutoff });
        if (excludeBookingId)
            qb.andWhere("eb.id != :exId", { exId: excludeBookingId });
        const existing = await qb.getMany();
        for (const b of existing) {
            // Get the space to read its setup/teardown (could cache but simple enough)
            const existStart = toMinutes(String(b.startTime)) - space.setupMinutes;
            const existEnd = toMinutes(String(b.endTime)) + space.teardownMinutes;
            // Overlap: !(proposedEnd <= existStart || proposedStart >= existEnd)
            if (!(proposedEnd <= existStart || proposedStart >= existEnd)) {
                return true;
            }
        }
        return false;
    }
    // ── Create booking ────────────────────────────────────────────────────
    async createBooking(userId, input) {
        const { eventCenterId, eventSpaceId, eventDate, startTime, endTime, eventType, pricingUsed, specialRequests } = input;
        const attendeeCount = Number(input.attendeeCount);
        // Validate event center
        const ec = await database_1.AppDataSource.getRepository(EventCenter_1.EventCenter).findOne({ where: { id: eventCenterId } });
        if (!ec)
            throw new AppError_1.AppError("Event center not found", 404);
        if (!ec.isAvailable)
            throw new AppError_1.AppError("This event center is not available for booking", 400);
        // Check event type restrictions
        if (ec.blockedEventTypes?.length && ec.blockedEventTypes.includes(eventType)) {
            throw new AppError_1.AppError(`"${eventType}" events are not allowed at this venue`, 400);
        }
        if (ec.allowedEventTypes?.length && !ec.allowedEventTypes.includes(eventType)) {
            throw new AppError_1.AppError(`This venue only accepts: ${ec.allowedEventTypes.join(", ")}`, 400);
        }
        // Validate space
        const space = await database_1.AppDataSource.getRepository(EventSpace_1.EventSpace).findOne({ where: { id: eventSpaceId, eventCenterId } });
        if (!space)
            throw new AppError_1.AppError("Event space not found for this venue", 404);
        // Validate attendees
        if (attendeeCount > space.capacity) {
            throw new AppError_1.AppError(`This space holds up to ${space.capacity} attendees`, 400);
        }
        // Validate date
        const date = new Date(eventDate);
        if (isNaN(date.getTime()))
            throw new AppError_1.AppError("Invalid event date", 400);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today)
            throw new AppError_1.AppError("Event date cannot be in the past", 400);
        // Validate times
        const startMin = toMinutes(startTime);
        const endMin = toMinutes(endTime);
        if (endMin <= startMin)
            throw new AppError_1.AppError("End time must be after start time", 400);
        const hours = (endMin - startMin) / 60;
        // Validate pricing mode
        if (pricingUsed === "hourly") {
            if (space.pricingMode !== "hourly" && space.pricingMode !== "hybrid") {
                throw new AppError_1.AppError("Hourly booking is not available for this space", 400);
            }
            if (hours < space.minHours) {
                throw new AppError_1.AppError(`Minimum booking is ${space.minHours} hours for this space`, 400);
            }
        }
        if (pricingUsed === "daily") {
            if (space.pricingMode !== "daily" && space.pricingMode !== "hybrid") {
                throw new AppError_1.AppError("Daily booking is not available for this space", 400);
            }
        }
        if (pricingUsed === "package") {
            if (space.pricingMode !== "package") {
                throw new AppError_1.AppError("Package booking is not available for this space", 400);
            }
        }
        // Check for time-slot conflicts
        if (await this.hasConflict(space, eventDate, startTime, endTime)) {
            throw new AppError_1.AppError("This time slot is not available — please choose a different time or date", 409);
        }
        // Calculate price
        let totalPrice;
        if (pricingUsed === "hourly") {
            totalPrice = Number(space.hourlyRate) * hours;
        }
        else if (pricingUsed === "daily") {
            totalPrice = Number(space.dailyRate);
        }
        else {
            // package
            totalPrice = Number(space.packageRate);
        }
        totalPrice = Math.round(totalPrice * 100) / 100;
        // Commission
        const host = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: ec.hostId } });
        const commissionRate = host
            ? await settingsService_1.settingsService.getEffectiveRateForHost(host)
            : await settingsService_1.settingsService.getEffectiveRate(null);
        const platformCommission = Math.round(totalPrice * commissionRate * 100) / 100;
        const hostPayout = Math.round((totalPrice - platformCommission) * 100) / 100;
        const booking = this.repo.create({
            userId,
            eventCenterId,
            eventSpaceId,
            eventDate: date,
            startTime,
            endTime,
            eventType,
            attendeeCount,
            pricingUsed,
            totalPrice,
            platformCommission,
            hostPayout,
            appliedCommissionRate: commissionRate,
            specialRequests: specialRequests?.trim() || null,
            status: "awaiting_payment",
        });
        const saved = await this.repo.save(booking);
        const full = await this.getById(saved.id, userId);
        // Notifications
        const guest = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: userId } });
        if (host) {
            const guestName = guest ? `${guest.firstName} ${guest.lastName}` : "A guest";
            emailService_1.emailService.sendHostNewBooking({
                to: host.email,
                hostName: host.firstName,
                guestName,
                propertyTitle: `${ec.name} — ${space.name} (${eventType})`,
                checkIn: eventDate,
                checkOut: `${startTime}–${endTime}`,
                guests: attendeeCount,
                nights: hours,
                totalPrice,
                platformCommission,
                hostPayout,
                commissionRate,
                bookingId: saved.id,
            }).catch(console.error);
            notificationService_1.notificationService.send({
                userId: host.id,
                type: "booking_request",
                title: "New event booking request",
                body: `${guestName} requested "${space.name}" at ${ec.name} for ${eventType} on ${eventDate} — awaiting payment.`,
                data: { url: `/dashboard/host`, urlLabel: "View bookings" },
            }).catch(console.error);
        }
        return full;
    }
    // ── Read ──────────────────────────────────────────────────────────────
    async getById(id, requesterId, requesterRole = "user") {
        const booking = await this.repo.findOne({
            where: { id },
            relations: ["eventCenter", "eventCenter.images", "eventSpace", "eventSpace.images", "user"],
        });
        if (!booking)
            throw new AppError_1.AppError("Event booking not found", 404);
        const isGuest = booking.userId === requesterId;
        const isHost = booking.eventCenter?.hostId === requesterId;
        const isAdmin = requesterRole === "admin";
        if (!isGuest && !isHost && !isAdmin) {
            throw new AppError_1.AppError("You do not have access to this booking", 403);
        }
        return booking;
    }
    async getUserBookings(userId) {
        return this.repo.find({
            where: { userId },
            relations: ["eventCenter", "eventCenter.images", "eventSpace"],
            order: { createdAt: "DESC" },
        });
    }
    async getHostBookings(hostId) {
        return this.repo
            .createQueryBuilder("eb")
            .innerJoinAndSelect("eb.eventCenter", "ec")
            .leftJoinAndSelect("ec.images", "ecImages")
            .innerJoinAndSelect("eb.eventSpace", "es")
            .innerJoinAndSelect("eb.user", "user")
            .where("ec.hostId = :hostId", { hostId })
            .orderBy("eb.createdAt", "DESC")
            .getMany();
    }
    // ── Update status ─────────────────────────────────────────────────────
    async updateStatus(id, status, requesterId, requesterRole, cancellationReason) {
        const booking = await this.getById(id, requesterId, requesterRole);
        const isHost = booking.eventCenter?.hostId === requesterId;
        const isAdmin = requesterRole === "admin";
        const isGuest = booking.userId === requesterId;
        if (status === "confirmed" || status === "completed") {
            if (!isHost && !isAdmin)
                throw new AppError_1.AppError("Only the host or admin can confirm or complete event bookings", 403);
        }
        if (status === "cancelled") {
            if (!isGuest && !isHost && !isAdmin)
                throw new AppError_1.AppError("You do not have permission to cancel this booking", 403);
            if (booking.status === "completed")
                throw new AppError_1.AppError("Completed bookings cannot be cancelled", 400);
            if (booking.status === "cancelled")
                throw new AppError_1.AppError("Already cancelled", 400);
            const cancelledBy = isAdmin ? "admin" : isHost ? "host" : "guest";
            await this.repo.update(id, {
                status: "cancelled",
                cancelledAt: new Date(),
                cancelledBy,
                cancellationReason: cancellationReason ?? null,
            });
            const updated = await this.repo.findOne({ where: { id }, relations: ["eventCenter", "eventSpace", "user"] });
            if (updated?.user) {
                notificationService_1.notificationService.send({
                    userId: updated.user.id,
                    type: "booking_cancelled",
                    title: "Event booking cancelled",
                    body: `Your ${updated.eventSpace?.name ?? "event"} booking at "${updated.eventCenter?.name}" has been cancelled.`,
                    data: { url: `/bookings`, urlLabel: "View bookings" },
                }).catch(console.error);
            }
            return updated;
        }
        // Non-cancel status update
        await this.repo.update(id, { status });
        return this.repo.findOne({ where: { id }, relations: ["eventCenter", "eventCenter.images", "eventSpace", "user"] });
    }
}
exports.eventBookingService = new EventBookingService();
//# sourceMappingURL=eventBookingService.js.map