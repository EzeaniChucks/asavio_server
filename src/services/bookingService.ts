// src/services/bookingService.ts
import { AppDataSource } from "../config/database";
import { Booking, BookingStatus } from "../entities/Booking";
import { Property } from "../entities/Property";
import { Vehicle } from "../entities/Vehicle";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";
import { NotificationType } from "../entities/Notification";
import { settingsService } from "./settingsService";
import { In } from "typeorm";

interface CreateBookingInput {
  // Exactly one of propertyId or vehicleId must be provided
  propertyId?: string;
  vehicleId?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  withDriver?: boolean; // vehicle bookings only
  purpose?: string;     // property bookings only
  specialRequests?: string;
}

export class BookingService {
  private bookingRepo = AppDataSource.getRepository(Booking);
  private propertyRepo = AppDataSource.getRepository(Property);
  private vehicleRepo = AppDataSource.getRepository(Vehicle);

  // ── Helpers ──────────────────────────────────────────────────────────────

  private nightsBetween(checkIn: Date, checkOut: Date): number {
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /** Returns true when there is a conflicting active booking for the given property or vehicle */
  private async hasConflict(
    field: "propertyId" | "vehicleId",
    id: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
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
  private isBlocked(
    checkIn: Date,
    checkOut: Date,
    blockedDates: { from: string; to: string }[] | null
  ): boolean {
    if (!blockedDates?.length) return false;
    return blockedDates.some((r) => {
      const from = new Date(r.from);
      const to = new Date(r.to);
      return checkIn < to && checkOut > from;
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async createBooking(userId: string, input: CreateBookingInput) {
    const { propertyId, vehicleId, checkIn: checkInStr, checkOut: checkOutStr, guests, purpose, specialRequests, withDriver } = input;

    if (!propertyId && !vehicleId) throw new AppError("Either propertyId or vehicleId is required", 400);
    if (propertyId && vehicleId) throw new AppError("Provide only one of propertyId or vehicleId", 400);

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new AppError("Invalid date format", 400);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) throw new AppError("Check-in date cannot be in the past", 400);
    if (checkOut <= checkIn) throw new AppError("Check-out must be after check-in", 400);
    const nights = this.nightsBetween(checkIn, checkOut);
    if (nights > 365) throw new AppError("Bookings cannot exceed 365 nights", 400);

    // ── Property booking ────────────────────────────────────────────────────
    if (propertyId) {
      const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
      if (!property) throw new AppError("Property not found", 404);
      if (!property.isAvailable) throw new AppError("This property is not available for booking", 400);
      if (guests > property.maxGuests) {
        throw new AppError(`This property accommodates up to ${property.maxGuests} guests`, 400);
      }
      if (this.isBlocked(checkIn, checkOut, property.blockedDates)) {
        throw new AppError("These dates are not available — the host has blocked them", 400);
      }
      if (await this.hasConflict("propertyId", propertyId, checkIn, checkOut)) {
        throw new AppError("These dates are not available — please choose different dates", 409);
      }

      const purposePrice = purpose && property.purposePricing
        ? Number(property.purposePricing[purpose])
        : NaN;
      const nightlyRate = Number.isFinite(purposePrice) && purposePrice > 0
        ? purposePrice
        : Number(property.pricePerNight);
      const totalPrice = nightlyRate * nights;

      const host = await AppDataSource.getRepository(User).findOne({ where: { id: property.hostId } });
      const commissionRate = host
        ? await settingsService.getEffectiveRateForHost(host)
        : await settingsService.getEffectiveRate(null);
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
      const saved = await this.bookingRepo.save(booking) as unknown as Booking;
      const full = await this.getBookingById(saved.id, userId);

      const guest = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
      if (host) {
        emailService.sendHostNewBooking({
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
        notificationService.send({
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
    const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId! } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    if (!vehicle.isAvailable) throw new AppError("This vehicle is not available for booking", 400);

    if (this.isBlocked(checkIn, checkOut, vehicle.blockedDates)) {
      throw new AppError("These dates are not available — the host has blocked them", 400);
    }
    if (await this.hasConflict("vehicleId", vehicleId!, checkIn, checkOut)) {
      throw new AppError("This vehicle is not available for these dates", 409);
    }

    const useDriver = withDriver && vehicle.priceWithDriverPerDay != null;
    const dailyRate = useDriver ? Number(vehicle.priceWithDriverPerDay) : Number(vehicle.pricePerDay);
    const totalPrice = dailyRate * nights;

    const host = await AppDataSource.getRepository(User).findOne({ where: { id: vehicle.hostId } });
    const commissionRate = host
      ? await settingsService.getEffectiveRateForHost(host)
      : await settingsService.getEffectiveRate(null);
    const platformCommission = Math.round(totalPrice * commissionRate * 100) / 100;
    const hostPayout = Math.round((totalPrice - platformCommission) * 100) / 100;

    const booking = this.bookingRepo.create({
      userId, propertyId: null, vehicleId: vehicleId!,
      checkIn, checkOut, guests, totalPrice,
      platformCommission, hostPayout,
      appliedCommissionRate: commissionRate,
      specialRequests, paymentMethod: "paystack",
      status: "awaiting_payment",
    });
    const saved = await this.bookingRepo.save(booking) as unknown as Booking;
    const full = await this.getBookingById(saved.id, userId);

    const guest = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    if (host && guest) {
      // Reuse sendHostNewBooking with vehicleTitle in place of propertyTitle
      emailService.sendHostNewBooking({
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
      notificationService.send({
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

  async getBookingById(id: string, requesterId: string, requesterRole = "user") {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ["property", "property.images", "vehicle", "user"],
    });

    if (!booking) throw new AppError("Booking not found", 404);

    // Only the guest, the property/vehicle host, or an admin may view
    const isGuest = booking.userId === requesterId;
    const isHost = booking.property?.hostId === requesterId || booking.vehicle?.hostId === requesterId;
    const isAdmin = requesterRole === "admin";

    if (!isGuest && !isHost && !isAdmin) {
      throw new AppError("You do not have access to this booking", 403);
    }

    return booking;
  }

  async getUserBookings(userId: string) {
    return this.bookingRepo.find({
      where: { userId },
      relations: ["property", "property.images", "vehicle"],
      order: { createdAt: "DESC" },
    });
  }

  async getHostBookings(hostId: string) {
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

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    requesterId: string,
    requesterRole: string
  ) {
    const booking = await this.getBookingById(id, requesterId, requesterRole);

    // Only host/admin can confirm or complete; user can only cancel
    const isHost = booking.property?.hostId === requesterId || booking.vehicle?.hostId === requesterId;
    const isAdmin = requesterRole === "admin";
    const isGuest = booking.userId === requesterId;

    if (status === "confirmed" || status === "completed") {
      if (!isHost && !isAdmin) {
        throw new AppError("Only the host or admin can confirm or complete bookings", 403);
      }
    }

    if (status === "cancelled") {
      if (!isGuest && !isHost && !isAdmin) {
        throw new AppError("You do not have permission to cancel this booking", 403);
      }
      if (booking.status === "completed") {
        throw new AppError("Completed bookings cannot be cancelled", 400);
      }
    }

    await this.bookingRepo.update(id, { status });
    const updated = await this.bookingRepo.findOne({
      where: { id },
      relations: ["property", "property.images", "user"],
    });

    // Notify guest of status change (best-effort)
    if (updated?.user) {
      emailService.sendBookingStatusUpdate({
        to: updated.user.email,
        firstName: updated.user.firstName,
        propertyTitle: updated.property?.title ?? "your property",
        status,
        bookingId: id,
      }).catch(console.error);

      // In-app notification to guest
      const typeMap: Record<string, NotificationType> = {
        confirmed: "booking_confirmed",
        cancelled: "booking_cancelled",
        completed: "booking_completed",
      };
      const notifType = typeMap[status];
      if (notifType) {
        notificationService.send({
          userId: updated.user.id,
          type: notifType,
          title: status === "confirmed"
            ? "Booking confirmed ✓"
            : status === "cancelled"
            ? "Booking cancelled"
            : "Booking completed",
          body: status === "confirmed"
            ? `Your booking for "${updated.property?.title ?? "your property"}" has been confirmed.`
            : status === "cancelled"
            ? `Your booking for "${updated.property?.title ?? "your property"}" has been cancelled.`
            : `Your stay at "${updated.property?.title ?? "your property"}" is now complete. We hope you enjoyed it!`,
          data: { url: `/bookings/${id}`, urlLabel: "View booking" },
        }).catch(console.error);
      }
    }

    return updated;
  }

  // ── Check availability (public helper) ───────────────────────────────────

  async checkAvailability(propertyId: string, checkIn: string, checkOut: string, purpose?: string) {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new AppError("Property not found", 404);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const conflict =
      this.isBlocked(checkInDate, checkOutDate, property.blockedDates) ||
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

  async checkVehicleAvailability(vehicleId: string, checkIn: string, checkOut: string, withDriver?: boolean) {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const conflict =
      this.isBlocked(checkInDate, checkOutDate, vehicle.blockedDates) ||
      await this.hasConflict("vehicleId", vehicleId, checkInDate, checkOutDate);
    const days = this.nightsBetween(checkInDate, checkOutDate);

    const useDriver = withDriver && vehicle.priceWithDriverPerDay != null;
    const dailyRate = useDriver ? Number(vehicle.priceWithDriverPerDay) : Number(vehicle.pricePerDay);

    return {
      available: vehicle.isAvailable && !conflict,
      pricePerDay: Number(vehicle.pricePerDay),
      priceWithDriverPerDay: vehicle.priceWithDriverPerDay ? Number(vehicle.priceWithDriverPerDay) : null,
      days,
      totalPrice: conflict ? 0 : dailyRate * days,
    };
  }

  /** Returns booked date ranges for a vehicle (for calendar display) */
  async getVehicleBookedDates(vehicleId: string): Promise<{ checkIn: string; checkOut: string }[]> {
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);
    const bookings = await this.bookingRepo
      .createQueryBuilder("b")
      .select(["b.checkIn", "b.checkOut"])
      .where("b.vehicleId = :vehicleId", { vehicleId })
      .andWhere("b.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
      .andWhere(
        "(b.status = 'confirmed' OR b.paymentStatus = 'paid' OR b.paystackReference IS NOT NULL OR b.createdAt > :cutoff)",
        { cutoff }
      )
      .getMany();
    return bookings.map((b) => ({
      checkIn: String(b.checkIn).split("T")[0],
      checkOut: String(b.checkOut).split("T")[0],
    }));
  }
}
