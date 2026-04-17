// src/services/bookingService.ts
import { AppDataSource } from "../config/database";
import { Booking, BookingStatus } from "../entities/Booking";
import { Property } from "../entities/Property";
import { Vehicle } from "../entities/Vehicle";
import { Hotel } from "../entities/Hotel";
import { RoomType } from "../entities/RoomType";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";
import { NotificationType } from "../entities/Notification";
import { settingsService } from "./settingsService";
import { paymentService } from "./paymentService";
import { calculateRefund, RefundEstimate } from "../constants/cancellationPolicies";
import { In } from "typeorm";

interface CreateBookingInput {
  // Exactly one of propertyId, vehicleId, or hotelId must be provided
  propertyId?: string;
  vehicleId?: string;
  hotelId?: string;             // hotel bookings only (paired with roomTypeId)
  roomTypeId?: string;          // hotel bookings only
  quantity?: number;            // hotel bookings: number of rooms to book (defaults to 1)
  checkIn: string;
  checkOut: string;
  guests: number;
  withDriver?: boolean;         // vehicle bookings only
  purpose?: string;             // property bookings only
  specialRequests?: string;
  travelScope?: "local" | "interstate"; // vehicle bookings only
  destination?: string;         // vehicle bookings only — required for interstate with-driver
}

export class BookingService {
  private bookingRepo = AppDataSource.getRepository(Booking);
  private propertyRepo = AppDataSource.getRepository(Property);
  private vehicleRepo = AppDataSource.getRepository(Vehicle);
  private hotelRepo = AppDataSource.getRepository(Hotel);
  private roomTypeRepo = AppDataSource.getRepository(RoomType);

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

  /**
   * For hotel bookings: returns the number of rooms of a given type already booked
   * that overlap the requested date range. Used to confirm room-type capacity.
   */
  private async countBookedRoomsOfType(
    roomTypeId: string,
    checkIn: Date,
    checkOut: Date
  ): Promise<number> {
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);
    const bookings = await this.bookingRepo
      .createQueryBuilder("b")
      .select(["b.quantity"])
      .where("b.roomTypeId = :roomTypeId", { roomTypeId })
      .andWhere("b.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
      .andWhere(
        "(b.status = 'confirmed' OR b.paymentStatus = 'paid' OR b.paystackReference IS NOT NULL OR b.createdAt > :cutoff)",
        { cutoff }
      )
      .andWhere("b.checkIn < :checkOut", { checkOut })
      .andWhere("b.checkOut > :checkIn", { checkIn })
      .getMany();

    return bookings.reduce((sum, b) => sum + (b.quantity ?? 1), 0);
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
      // "to" is inclusive — a blocked range of Apr 9→12 means Apr 12 is blocked
      return checkIn <= to && checkOut > from;
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async createBooking(userId: string, input: CreateBookingInput) {
    const {
      propertyId, vehicleId, hotelId, roomTypeId, quantity: qtyInput,
      checkIn: checkInStr, checkOut: checkOutStr, guests,
      purpose, specialRequests, withDriver, travelScope, destination,
    } = input;

    const provided = [propertyId, vehicleId, hotelId].filter(Boolean).length;
    if (provided === 0) throw new AppError("Either propertyId, vehicleId, or hotelId is required", 400);
    if (provided > 1) throw new AppError("Provide only one of propertyId, vehicleId, or hotelId", 400);
    if (hotelId && !roomTypeId) throw new AppError("roomTypeId is required for hotel bookings", 400);

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

    // ── Hotel booking ────────────────────────────────────────────────────────
    if (hotelId) {
      const hotel = await this.hotelRepo.findOne({ where: { id: hotelId } });
      if (!hotel) throw new AppError("Hotel not found", 404);
      if (!hotel.isAvailable) throw new AppError("This hotel is not available for booking", 400);

      const roomType = await this.roomTypeRepo.findOne({ where: { id: roomTypeId!, hotelId } });
      if (!roomType) throw new AppError("Room type not found for this hotel", 404);

      const quantity = Math.max(1, Number(qtyInput ?? 1));
      if (!Number.isFinite(quantity) || quantity < 1) {
        throw new AppError("Quantity must be a positive integer", 400);
      }
      if (guests > roomType.maxGuests * quantity) {
        throw new AppError(
          `Each ${roomType.name} fits up to ${roomType.maxGuests} guests. Book more rooms for larger groups.`,
          400
        );
      }

      // Check remaining inventory for the date range
      const alreadyBooked = await this.countBookedRoomsOfType(roomType.id, checkIn, checkOut);
      const available = roomType.totalUnits - alreadyBooked;
      if (available < quantity) {
        throw new AppError(
          available > 0
            ? `Only ${available} ${roomType.name} room${available === 1 ? "" : "s"} left for those dates — reduce quantity or pick different dates.`
            : `No ${roomType.name} rooms available for those dates.`,
          409
        );
      }

      const nightlyRate = Number(roomType.pricePerNight);
      const totalPrice = nightlyRate * nights * quantity;

      const host = await AppDataSource.getRepository(User).findOne({ where: { id: hotel.hostId } });
      const commissionRate = host
        ? await settingsService.getEffectiveRateForHost(host)
        : await settingsService.getEffectiveRate(null);
      const platformCommission = Math.round(totalPrice * commissionRate * 100) / 100;
      const hostPayout = Math.round((totalPrice - platformCommission) * 100) / 100;

      const booking = this.bookingRepo.create({
        userId,
        propertyId: null, vehicleId: null,
        hotelId, roomTypeId: roomType.id, quantity,
        checkIn, checkOut, guests, totalPrice,
        platformCommission, hostPayout,
        appliedCommissionRate: commissionRate,
        specialRequests, paymentMethod: "paystack",
        status: "awaiting_payment",
      });
      const saved = await this.bookingRepo.save(booking) as unknown as Booking;
      const full = await this.getBookingById(saved.id, userId);

      const guest = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
      if (host) {
        const guestName = guest ? `${guest.firstName} ${guest.lastName}` : "A guest";
        const summary = `${quantity} × ${roomType.name}`;
        emailService.sendHostNewBooking({
          to: host.email, hostName: host.firstName,
          guestName,
          propertyTitle: `${hotel.name} — ${summary}`,
          checkIn: checkIn.toLocaleDateString("en-GB"),
          checkOut: checkOut.toLocaleDateString("en-GB"),
          guests, nights, totalPrice, platformCommission, hostPayout, commissionRate,
          bookingId: saved.id,
        }).catch(console.error);

        notificationService.send({
          userId: host.id,
          type: "booking_request",
          title: "New hotel booking request",
          body: `${guestName} requested ${summary} at "${hotel.name}" — awaiting payment.`,
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

    // Travel zone validation
    const resolvedScope: "local" | "interstate" = travelScope ?? "local";
    if (resolvedScope === "interstate" && !vehicle.allowInterstate) {
      throw new AppError("This vehicle is not available for interstate travel", 400);
    }

    const useDriver = withDriver && vehicle.priceWithDriverPerDay != null;
    const baseDailyRate = useDriver ? Number(vehicle.priceWithDriverPerDay) : Number(vehicle.pricePerDay);
    const surcharge = resolvedScope === "interstate" && vehicle.interstateSurchargePerDay
      ? Number(vehicle.interstateSurchargePerDay)
      : 0;
    const dailyRate = baseDailyRate + surcharge;
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
      travelScope: resolvedScope,
      destination: destination ?? null,
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
      relations: ["property", "property.images", "vehicle", "hotel", "hotel.images", "roomType", "roomType.images", "user"],
    });

    if (!booking) throw new AppError("Booking not found", 404);

    // Only the guest, the property/vehicle/hotel host, or an admin may view
    const isGuest = booking.userId === requesterId;
    const isHost =
      booking.property?.hostId === requesterId ||
      booking.vehicle?.hostId === requesterId ||
      booking.hotel?.hostId === requesterId;
    const isAdmin = requesterRole === "admin";

    if (!isGuest && !isHost && !isAdmin) {
      throw new AppError("You do not have access to this booking", 403);
    }

    return booking;
  }

  async getUserBookings(userId: string) {
    return this.bookingRepo.find({
      where: { userId },
      relations: ["property", "property.images", "vehicle", "hotel", "hotel.images", "roomType"],
      order: { createdAt: "DESC" },
    });
  }

  async getHostBookings(hostId: string) {
    return this.bookingRepo
      .createQueryBuilder("booking")
      .leftJoinAndSelect("booking.property", "property")
      .leftJoinAndSelect("property.images", "propertyImages")
      .leftJoinAndSelect("booking.vehicle", "vehicle")
      .leftJoinAndSelect("booking.hotel", "hotel")
      .leftJoinAndSelect("hotel.images", "hotelImages")
      .leftJoinAndSelect("booking.roomType", "roomType")
      .innerJoinAndSelect("booking.user", "user")
      .where("property.hostId = :hostId", { hostId })
      .orWhere("vehicle.hostId = :hostId", { hostId })
      .orWhere("hotel.hostId = :hostId", { hostId })
      .orderBy("booking.createdAt", "DESC")
      .getMany();
  }

  // ── Hotel-specific helpers ───────────────────────────────────────────────

  /** Booked date ranges for a specific room type (for calendar display) */
  async getHotelRoomBookedDates(
    roomTypeId: string
  ): Promise<{ checkIn: string; checkOut: string; quantity: number }[]> {
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);
    const bookings = await this.bookingRepo
      .createQueryBuilder("b")
      .select(["b.checkIn", "b.checkOut", "b.quantity"])
      .where("b.roomTypeId = :roomTypeId", { roomTypeId })
      .andWhere("b.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
      .andWhere(
        "(b.status = 'confirmed' OR b.paymentStatus = 'paid' OR b.paystackReference IS NOT NULL OR b.createdAt > :cutoff)",
        { cutoff }
      )
      .getMany();
    return bookings.map((b) => ({
      checkIn: String(b.checkIn).split("T")[0],
      checkOut: String(b.checkOut).split("T")[0],
      quantity: b.quantity ?? 1,
    }));
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
    requesterId: string,
    requesterRole: string,
    cancellationReason?: string
  ) {
    const booking = await this.getBookingById(id, requesterId, requesterRole);

    const isHost =
      booking.property?.hostId === requesterId ||
      booking.vehicle?.hostId === requesterId ||
      booking.hotel?.hostId === requesterId;
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
      if (booking.status === "cancelled") {
        throw new AppError("This booking is already cancelled", 400);
      }
    }

    // ── Cancellation with refund logic ───────────────────────────────────────
    if (status === "cancelled") {
      const cancelledBy: "guest" | "host" | "admin" = isAdmin ? "admin" : isHost ? "host" : "guest";
      const listingTitle =
        booking.property?.title ??
        booking.hotel?.name ??
        (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");

      const policy =
        (booking.property as any)?.cancellationPolicy ??
        (booking.hotel as any)?.cancellationPolicy ??
        (booking.vehicle as any)?.cancellationPolicy ??
        "flexible";

      let refundEstimate: RefundEstimate = {
        refundAmount: 0,
        inGracePeriod: false,
        reason: "No payment was made — no refund required.",
        policy,
      };

      if (booking.paymentStatus === "paid" && booking.paystackReference) {
        refundEstimate = calculateRefund({
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
            await paymentService.refundTransaction(booking.paystackReference, refundEstimate.refundAmount);
          } catch (err) {
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
        emailService.sendCancellationRefund({
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

        notificationService.send({
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
      emailService.sendBookingStatusUpdate({
        to: updated.user.email,
        firstName: updated.user.firstName,
        propertyTitle: updated.property?.title ?? "your property",
        status,
        bookingId: id,
      }).catch(console.error);

      const typeMap: Record<string, NotificationType> = {
        confirmed: "booking_confirmed",
        completed: "booking_completed",
      };
      const notifType = typeMap[status];
      if (notifType) {
        notificationService.send({
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
  async getCancellationEstimate(
    id: string,
    requesterId: string,
    requesterRole: string
  ): Promise<RefundEstimate & { listingTitle: string; totalPaid: number }> {
    const booking = await this.getBookingById(id, requesterId, requesterRole);

    const isAdmin = requesterRole === "admin";
    const isHost =
      booking.property?.hostId === requesterId ||
      booking.vehicle?.hostId === requesterId ||
      booking.hotel?.hostId === requesterId;
    const cancelledBy: "guest" | "host" | "admin" = isAdmin ? "admin" : isHost ? "host" : "guest";

    const listingTitle =
      booking.property?.title ??
      booking.hotel?.name ??
      (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");

    const policy =
      (booking.property as any)?.cancellationPolicy ??
      (booking.hotel as any)?.cancellationPolicy ??
      (booking.vehicle as any)?.cancellationPolicy ??
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

    const estimate = calculateRefund({
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

  async checkVehicleAvailability(
    vehicleId: string,
    checkIn: string,
    checkOut: string,
    withDriver?: boolean,
    travelScope?: "local" | "interstate"
  ) {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const conflict =
      this.isBlocked(checkInDate, checkOutDate, vehicle.blockedDates) ||
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
