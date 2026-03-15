// src/services/bookingService.ts
import { AppDataSource } from "../config/database";
import { Booking, BookingStatus } from "../entities/Booking";
import { Property } from "../entities/Property";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";

interface CreateBookingInput {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  specialRequests?: string;
}

export class BookingService {
  private bookingRepo = AppDataSource.getRepository(Booking);
  private propertyRepo = AppDataSource.getRepository(Property);

  // ── Helpers ──────────────────────────────────────────────────────────────

  private nightsBetween(checkIn: Date, checkOut: Date): number {
    const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /** Returns true when the property has a conflicting confirmed/pending booking */
  private async hasConflict(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string
  ): Promise<boolean> {
    const qb = this.bookingRepo
      .createQueryBuilder("booking")
      .where("booking.propertyId = :propertyId", { propertyId })
      .andWhere("booking.status IN (:...statuses)", {
        statuses: ["awaiting_payment", "confirmed"],
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

  async createBooking(userId: string, input: CreateBookingInput) {
    const { propertyId, checkIn: checkInStr, checkOut: checkOutStr, guests, specialRequests } = input;

    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new AppError("Property not found", 404);
    if (!property.isAvailable) throw new AppError("This property is not available for booking", 400);
    if (guests > property.maxGuests) {
      throw new AppError(`This property accommodates up to ${property.maxGuests} guests`, 400);
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    if (await this.hasConflict(propertyId, checkIn, checkOut)) {
      throw new AppError("These dates are not available — please choose different dates", 409);
    }

    const nights = this.nightsBetween(checkIn, checkOut);
    const totalPrice = Number(property.pricePerNight) * nights;
    const commissionRate = Number(process.env.PLATFORM_COMMISSION_RATE ?? 0.10);
    const platformCommission = Math.round(totalPrice * commissionRate * 100) / 100;
    const hostPayout = Math.round((totalPrice - platformCommission) * 100) / 100;

    const booking = this.bookingRepo.create({
      userId,
      propertyId,
      checkIn,
      checkOut,
      guests,
      totalPrice,
      platformCommission,
      hostPayout,
      specialRequests,
      paymentMethod: "paystack",
      status: "awaiting_payment",
    });

    const saved = await this.bookingRepo.save(booking) as unknown as Booking;
    const full = await this.getBookingById(saved.id, userId);

    // Notify host of the new booking request (guest confirmation sent after payment succeeds)
    const guest = await AppDataSource.getRepository(User).findOne({ where: { id: userId } });
    const host = await AppDataSource.getRepository(User).findOne({ where: { id: property.hostId } });

    if (host) {
      emailService.sendHostNewBooking({
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

  async getBookingById(id: string, requesterId: string, requesterRole = "user") {
    const booking = await this.bookingRepo.findOne({
      where: { id },
      relations: ["property", "property.images", "user"],
    });

    if (!booking) throw new AppError("Booking not found", 404);

    // Only the guest, the property host, or an admin may view
    const isGuest = booking.userId === requesterId;
    const isHost = booking.property?.hostId === requesterId;
    const isAdmin = requesterRole === "admin";

    if (!isGuest && !isHost && !isAdmin) {
      throw new AppError("You do not have access to this booking", 403);
    }

    return booking;
  }

  async getUserBookings(userId: string) {
    return this.bookingRepo.find({
      where: { userId },
      relations: ["property", "property.images"],
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
    const isHost = booking.property?.hostId === requesterId;
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
    }

    return updated;
  }

  // ── Check availability (public helper) ───────────────────────────────────

  async checkAvailability(propertyId: string, checkIn: string, checkOut: string) {
    const property = await this.propertyRepo.findOne({ where: { id: propertyId } });
    if (!property) throw new AppError("Property not found", 404);

    const conflict = await this.hasConflict(
      propertyId,
      new Date(checkIn),
      new Date(checkOut)
    );

    return {
      available: property.isAvailable && !conflict,
      pricePerNight: property.pricePerNight,
      nights: this.nightsBetween(new Date(checkIn), new Date(checkOut)),
      totalPrice: conflict ? 0 : Number(property.pricePerNight) * this.nightsBetween(new Date(checkIn), new Date(checkOut)),
    };
  }
}
