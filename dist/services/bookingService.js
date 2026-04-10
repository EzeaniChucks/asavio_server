"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
// src/services/bookingService.ts
const database_1 = require("../config/database");
const Booking_1 = require("../entities/Booking");
const Property_1 = require("../entities/Property");
const Vehicle_1 = require("../entities/Vehicle");
const User_1 = require("../entities/User");
const AppError_1 = require("../utils/AppError");
const emailService_1 = require("./emailService");
const notificationService_1 = require("./notificationService");
const settingsService_1 = require("./settingsService");
const paymentService_1 = require("./paymentService");
const cancellationPolicies_1 = require("../constants/cancellationPolicies");
class BookingService {
    constructor() {
        this.bookingRepo = database_1.AppDataSource.getRepository(Booking_1.Booking);
        this.propertyRepo = database_1.AppDataSource.getRepository(Property_1.Property);
        this.vehicleRepo = database_1.AppDataSource.getRepository(Vehicle_1.Vehicle);
    }
    // ── Helpers ──────────────────────────────────────────────────────────────
    nightsBetween(checkIn, checkOut) {
        const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.ceil(ms / (1000 * 60 * 60 * 24));
    }
    /** Returns true when there is a conflicting active booking for the given property or vehicle */
    async hasConflict(field, id, checkIn, checkOut, excludeBookingId) {
        const qb = this.bookingRepo
            .createQueryBuilder("booking")
            .where(`booking.${field} = :id`, { id })
            .andWhere("booking.status IN (:...statuses)", {
            statuses: ["awaiting_payment", "confirmed"],
        })
            .andWhere("booking.checkIn < :checkOut", { checkOut })
            .andWhere("booking.checkOut > :checkIn", { checkIn });
        if (excludeBookingId) {
            qb.andWhere("booking.id != :excludeBookingId", { excludeBookingId });
        }
        const count = await qb.getCount();
        return count > 0;
    }
    /** Returns true if the date range overlaps any host-blocked range on the property */
    isBlocked(checkIn, checkOut, blockedDates) {
        if (!blockedDates?.length)
            return false;
        return blockedDates.some((r) => {
            const from = new Date(r.from);
            const to = new Date(r.to);
            // "to" is inclusive — a blocked range of Apr 9→12 means Apr 12 is blocked
            return checkIn <= to && checkOut > from;
        });
    }
    // ── Create ────────────────────────────────────────────────────────────────
    async createBooking(userId, input) {
        const { propertyId, vehicleId, checkIn: checkInStr, checkOut: checkOutStr, guests, purpose, specialRequests, withDriver, travelScope, destination } = input;
        if (!propertyId && !vehicleId)
            throw new AppError_1.AppError("Either propertyId or vehicleId is required", 400);
        if (propertyId && vehicleId)
            throw new AppError_1.AppError("Provide only one of propertyId or vehicleId", 400);
        const checkIn = new Date(checkInStr);
        const checkOut = new Date(checkOutStr);
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            throw new AppError_1.AppError("Invalid date format", 400);
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkIn < today)
            throw new AppError_1.AppError("Check-in date cannot be in the past", 400);
        if (checkOut <= checkIn)
            throw new AppError_1.AppError("Check-out must be after check-in", 400);
        const nights = this.nightsBetween(checkIn, checkOut);
        if (nights > 365)
            throw new AppError_1.AppError("Bookings cannot exceed 365 nights", 400);
        // ── Property booking ────────────────────────────────────────────────────
        if (propertyId) {
            const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
            if (!property)
                throw new AppError_1.AppError("Property not found", 404);
            if (!property.isAvailable)
                throw new AppError_1.AppError("This property is not available for booking", 400);
            if (guests > property.maxGuests) {
                throw new AppError_1.AppError(`This property accommodates up to ${property.maxGuests} guests`, 400);
            }
            if (this.isBlocked(checkIn, checkOut, property.blockedDates)) {
                throw new AppError_1.AppError("These dates are not available — the host has blocked them", 400);
            }
            if (await this.hasConflict("propertyId", propertyId, checkIn, checkOut)) {
                throw new AppError_1.AppError("These dates are not available — please choose different dates", 409);
            }
            const purposePrice = purpose && property.purposePricing
                ? Number(property.purposePricing[purpose])
                : NaN;
            const nightlyRate = Number.isFinite(purposePrice) && purposePrice > 0
                ? purposePrice
                : Number(property.pricePerNight);
            const totalPrice = nightlyRate * nights;
            const host = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: property.hostId } });
            const commissionRate = host
                ? await settingsService_1.settingsService.getEffectiveRateForHost(host)
                : await settingsService_1.settingsService.getEffectiveRate(null);
            const platformCommission = Math.round(totalPrice * commissionRate * 100) / 100;
            const hostPayout = Math.round((totalPrice - platformCommission) * 100) / 100;
            const booking = this.bookingRepo.create({
                userId, propertyId, vehicleId: null,
                checkIn, checkOut, guests, purpose, totalPrice,
                platformCommission, hostPayout,
                appliedCommissionRate: commissionRate,
                specialRequests, paymentMethod: "paystack",
                status: "awaiting_payment",
            });
            const saved = await this.bookingRepo.save(booking);
            const full = await this.getBookingById(saved.id, userId);
            const guest = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: userId } });
            if (host) {
                emailService_1.emailService.sendHostNewBooking({
                    to: host.email, hostName: host.firstName,
                    guestName: guest ? `${guest.firstName} ${guest.lastName}` : "A guest",
                    propertyTitle: property.title,
                    checkIn: checkIn.toLocaleDateString("en-GB"),
                    checkOut: checkOut.toLocaleDateString("en-GB"),
                    guests, nights, totalPrice, platformCommission, hostPayout, commissionRate,
                    bookingId: saved.id,
                }).catch(console.error);
                // In-app notification to host — new booking request
                const guestName = guest ? `${guest.firstName} ${guest.lastName}` : "A guest";
                notificationService_1.notificationService.send({
                    userId: host.id,
                    type: "booking_request",
                    title: "New booking request",
                    body: `${guestName} has requested to book "${property.title}" — awaiting payment.`,
                    data: { url: `/dashboard/host`, urlLabel: "View bookings" },
                }).catch(console.error);
            }
            return full;
        }
        // ── Vehicle booking ──────────────────────────────────────────────────────
        const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId } });
        if (!vehicle)
            throw new AppError_1.AppError("Vehicle not found", 404);
        if (!vehicle.isAvailable)
            throw new AppError_1.AppError("This vehicle is not available for booking", 400);
        if (this.isBlocked(checkIn, checkOut, vehicle.blockedDates)) {
            throw new AppError_1.AppError("These dates are not available — the host has blocked them", 400);
        }
        if (await this.hasConflict("vehicleId", vehicleId, checkIn, checkOut)) {
            throw new AppError_1.AppError("This vehicle is not available for these dates", 409);
        }
        // Travel zone validation
        const resolvedScope = travelScope ?? "local";
        if (resolvedScope === "interstate" && !vehicle.allowInterstate) {
            throw new AppError_1.AppError("This vehicle is not available for interstate travel", 400);
        }
        const useDriver = withDriver && vehicle.priceWithDriverPerDay != null;
        const baseDailyRate = useDriver ? Number(vehicle.priceWithDriverPerDay) : Number(vehicle.pricePerDay);
        const surcharge = resolvedScope === "interstate" && vehicle.interstateSurchargePerDay
            ? Number(vehicle.interstateSurchargePerDay)
            : 0;
        const dailyRate = baseDailyRate + surcharge;
        const totalPrice = dailyRate * nights;
        const host = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: vehicle.hostId } });
        const commissionRate = host
            ? await settingsService_1.settingsService.getEffectiveRateForHost(host)
            : await settingsService_1.settingsService.getEffectiveRate(null);
        const platformCommission = Math.round(totalPrice * commissionRate * 100) / 100;
        const hostPayout = Math.round((totalPrice - platformCommission) * 100) / 100;
        const booking = this.bookingRepo.create({
            userId, propertyId: null, vehicleId: vehicleId,
            checkIn, checkOut, guests, totalPrice,
            platformCommission, hostPayout,
            appliedCommissionRate: commissionRate,
            specialRequests, paymentMethod: "paystack",
            status: "awaiting_payment",
            travelScope: resolvedScope,
            destination: destination ?? null,
        });
        const saved = await this.bookingRepo.save(booking);
        const full = await this.getBookingById(saved.id, userId);
        const guest = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: userId } });
        if (host && guest) {
            // Reuse sendHostNewBooking with vehicleTitle in place of propertyTitle
            emailService_1.emailService.sendHostNewBooking({
                to: host.email, hostName: host.firstName,
                guestName: `${guest.firstName} ${guest.lastName}`,
                propertyTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                checkIn: checkIn.toLocaleDateString("en-GB"),
                checkOut: checkOut.toLocaleDateString("en-GB"),
                guests, nights, totalPrice, platformCommission, hostPayout, commissionRate,
                bookingId: saved.id,
            }).catch(console.error);
        }
        if (host) {
            // In-app notification to host — new vehicle booking request
            const guestName = guest ? `${guest.firstName} ${guest.lastName}` : "A guest";
            notificationService_1.notificationService.send({
                userId: host.id,
                type: "booking_request",
                title: "New vehicle booking request",
                body: `${guestName} has requested to book your ${vehicle.make} ${vehicle.model} — awaiting payment.`,
                data: { url: `/dashboard/host`, urlLabel: "View bookings" },
            }).catch(console.error);
        }
        return full;
    }
    // ── Read ──────────────────────────────────────────────────────────────────
    async getBookingById(id, requesterId, requesterRole = "user") {
        const booking = await this.bookingRepo.findOne({
            where: { id },
            relations: ["property", "property.images", "vehicle", "user"],
        });
        if (!booking)
            throw new AppError_1.AppError("Booking not found", 404);
        // Only the guest, the property/vehicle host, or an admin may view
        const isGuest = booking.userId === requesterId;
        const isHost = booking.property?.hostId === requesterId || booking.vehicle?.hostId === requesterId;
        const isAdmin = requesterRole === "admin";
        if (!isGuest && !isHost && !isAdmin) {
            throw new AppError_1.AppError("You do not have access to this booking", 403);
        }
        return booking;
    }
    async getUserBookings(userId) {
        return this.bookingRepo.find({
            where: { userId },
            relations: ["property", "property.images", "vehicle"],
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
    async updateBookingStatus(id, status, requesterId, requesterRole, cancellationReason) {
        const booking = await this.getBookingById(id, requesterId, requesterRole);
        const isHost = booking.property?.hostId === requesterId || booking.vehicle?.hostId === requesterId;
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
            if (booking.status === "cancelled") {
                throw new AppError_1.AppError("This booking is already cancelled", 400);
            }
        }
        // ── Cancellation with refund logic ───────────────────────────────────────
        if (status === "cancelled") {
            const cancelledBy = isAdmin ? "admin" : isHost ? "host" : "guest";
            const listingTitle = booking.property?.title ??
                (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");
            const policy = booking.property?.cancellationPolicy ??
                booking.vehicle?.cancellationPolicy ??
                "flexible";
            let refundEstimate = {
                refundAmount: 0,
                inGracePeriod: false,
                reason: "No payment was made — no refund required.",
                policy,
            };
            if (booking.paymentStatus === "paid" && booking.paystackReference) {
                refundEstimate = (0, cancellationPolicies_1.calculateRefund)({
                    totalPrice: Number(booking.totalPrice),
                    hostPayout: Number(booking.hostPayout),
                    checkIn: new Date(booking.checkIn),
                    createdAt: new Date(booking.createdAt),
                    policy,
                    cancelledBy,
                });
                if (refundEstimate.refundAmount > 0) {
                    // Process Paystack refund (best-effort — don't block cancellation if it fails)
                    try {
                        await paymentService_1.paymentService.refundTransaction(booking.paystackReference, refundEstimate.refundAmount);
                    }
                    catch (err) {
                        console.error("[Cancellation] Paystack refund failed for booking", id, err);
                        // Record the failed attempt in notes — admin can retry manually
                        refundEstimate.reason += " [Paystack refund call failed — manual action required]";
                    }
                }
            }
            // Persist cancellation fields
            await this.bookingRepo.update(id, {
                status: "cancelled",
                paymentStatus: refundEstimate.refundAmount > 0 ? "refunded" : booking.paymentStatus,
                refundedAmount: refundEstimate.refundAmount > 0 ? refundEstimate.refundAmount : null,
                cancelledAt: new Date(),
                cancelledBy,
                cancellationReason: cancellationReason ?? null,
            });
            const updated = await this.bookingRepo.findOne({
                where: { id },
                relations: ["property", "property.images", "vehicle", "user"],
            });
            if (updated?.user) {
                // Cancellation + refund email
                emailService_1.emailService.sendCancellationRefund({
                    to: updated.user.email,
                    firstName: updated.user.firstName,
                    listingTitle,
                    checkIn: new Date(booking.checkIn).toLocaleDateString("en-GB"),
                    checkOut: new Date(booking.checkOut).toLocaleDateString("en-GB"),
                    refundAmount: refundEstimate.refundAmount,
                    totalPaid: Number(booking.totalPrice),
                    reason: refundEstimate.reason,
                    bookingId: id,
                }).catch(console.error);
                notificationService_1.notificationService.send({
                    userId: updated.user.id,
                    type: "booking_cancelled",
                    title: "Booking cancelled",
                    body: refundEstimate.refundAmount > 0
                        ? `Your booking for "${listingTitle}" was cancelled. Refund of ₦${Number(refundEstimate.refundAmount).toLocaleString("en-NG")} is being processed.`
                        : `Your booking for "${listingTitle}" has been cancelled.`,
                    data: { url: `/bookings/${id}`, urlLabel: "View booking" },
                }).catch(console.error);
            }
            return updated;
        }
        // ── Non-cancellation status updates ─────────────────────────────────────
        await this.bookingRepo.update(id, { status });
        const updated = await this.bookingRepo.findOne({
            where: { id },
            relations: ["property", "property.images", "user"],
        });
        if (updated?.user) {
            emailService_1.emailService.sendBookingStatusUpdate({
                to: updated.user.email,
                firstName: updated.user.firstName,
                propertyTitle: updated.property?.title ?? "your property",
                status,
                bookingId: id,
            }).catch(console.error);
            const typeMap = {
                confirmed: "booking_confirmed",
                completed: "booking_completed",
            };
            const notifType = typeMap[status];
            if (notifType) {
                notificationService_1.notificationService.send({
                    userId: updated.user.id,
                    type: notifType,
                    title: status === "confirmed" ? "Booking confirmed ✓" : "Booking completed",
                    body: status === "confirmed"
                        ? `Your booking for "${updated.property?.title ?? "your property"}" has been confirmed.`
                        : `Your stay at "${updated.property?.title ?? "your property"}" is now complete. We hope you enjoyed it!`,
                    data: { url: `/bookings/${id}`, urlLabel: "View booking" },
                }).catch(console.error);
            }
        }
        return updated;
    }
    /**
     * Returns a refund estimate for a booking without modifying anything.
     * Used so the frontend can show the guest what they'll receive before they confirm cancellation.
     */
    async getCancellationEstimate(id, requesterId, requesterRole) {
        const booking = await this.getBookingById(id, requesterId, requesterRole);
        const isAdmin = requesterRole === "admin";
        const isHost = booking.property?.hostId === requesterId || booking.vehicle?.hostId === requesterId;
        const cancelledBy = isAdmin ? "admin" : isHost ? "host" : "guest";
        const listingTitle = booking.property?.title ??
            (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");
        const policy = booking.property?.cancellationPolicy ??
            booking.vehicle?.cancellationPolicy ??
            "flexible";
        if (booking.paymentStatus !== "paid") {
            return {
                refundAmount: 0,
                inGracePeriod: false,
                reason: "No payment was made — no refund will be issued.",
                policy,
                listingTitle,
                totalPaid: Number(booking.totalPrice),
            };
        }
        const estimate = (0, cancellationPolicies_1.calculateRefund)({
            totalPrice: Number(booking.totalPrice),
            hostPayout: Number(booking.hostPayout),
            checkIn: new Date(booking.checkIn),
            createdAt: new Date(booking.createdAt),
            policy,
            cancelledBy,
        });
        return { ...estimate, listingTitle, totalPaid: Number(booking.totalPrice) };
    }
    // ── Check availability (public helper) ───────────────────────────────────
    async checkAvailability(propertyId, checkIn, checkOut, purpose) {
        const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
        if (!property)
            throw new AppError_1.AppError("Property not found", 404);
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const conflict = this.isBlocked(checkInDate, checkOutDate, property.blockedDates) ||
            await this.hasConflict("propertyId", propertyId, checkInDate, checkOutDate);
        const nights = this.nightsBetween(checkInDate, checkOutDate);
        const purposePrice = purpose && property.purposePricing
            ? Number(property.purposePricing[purpose])
            : NaN;
        const nightlyRate = Number.isFinite(purposePrice) && purposePrice > 0
            ? purposePrice
            : Number(property.pricePerNight);
        return {
            available: property.isAvailable && !conflict,
            pricePerNight: nightlyRate,
            nights,
            totalPrice: conflict ? 0 : nightlyRate * nights,
            purposePricing: property.purposePricing ?? null,
        };
    }
    async checkVehicleAvailability(vehicleId, checkIn, checkOut, withDriver, travelScope) {
        const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId } });
        if (!vehicle)
            throw new AppError_1.AppError("Vehicle not found", 404);
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const conflict = this.isBlocked(checkInDate, checkOutDate, vehicle.blockedDates) ||
            await this.hasConflict("vehicleId", vehicleId, checkInDate, checkOutDate);
        const days = this.nightsBetween(checkInDate, checkOutDate);
        const useDriver = withDriver && vehicle.priceWithDriverPerDay != null;
        const baseDailyRate = useDriver ? Number(vehicle.priceWithDriverPerDay) : Number(vehicle.pricePerDay);
        const surcharge = travelScope === "interstate" && vehicle.interstateSurchargePerDay
            ? Number(vehicle.interstateSurchargePerDay)
            : 0;
        const effectiveDailyRate = baseDailyRate + surcharge;
        return {
            available: vehicle.isAvailable && !conflict,
            pricePerDay: Number(vehicle.pricePerDay),
            priceWithDriverPerDay: vehicle.priceWithDriverPerDay ? Number(vehicle.priceWithDriverPerDay) : null,
            interstateSurchargePerDay: vehicle.interstateSurchargePerDay ? Number(vehicle.interstateSurchargePerDay) : null,
            effectiveDailyRate,
            travelZone: vehicle.travelZone,
            allowInterstate: vehicle.allowInterstate,
            days,
            totalPrice: conflict ? 0 : effectiveDailyRate * days,
        };
    }
    /** Returns booked date ranges for a vehicle (for calendar display) */
    async getVehicleBookedDates(vehicleId) {
        const cutoff = new Date(Date.now() - 45 * 60 * 1000);
        const bookings = await this.bookingRepo
            .createQueryBuilder("b")
            .select(["b.checkIn", "b.checkOut"])
            .where("b.vehicleId = :vehicleId", { vehicleId })
            .andWhere("b.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
            .andWhere("(b.status = 'confirmed' OR b.paymentStatus = 'paid' OR b.paystackReference IS NOT NULL OR b.createdAt > :cutoff)", { cutoff })
            .getMany();
        return bookings.map((b) => ({
            checkIn: String(b.checkIn).split("T")[0],
            checkOut: String(b.checkOut).split("T")[0],
        }));
    }
}
exports.BookingService = BookingService;
//# sourceMappingURL=bookingService.js.map