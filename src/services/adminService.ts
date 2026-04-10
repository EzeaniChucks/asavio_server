// src/services/adminService.ts
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { Vehicle } from "../entities/Vehicle";
import { Booking } from "../entities/Booking";
import { Review } from "../entities/Review";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";
import { paymentService } from "./paymentService";

class AdminService {
  // ── Stats ────────────────────────────────────────────────────

  async getStats() {
    const [
      totalUsers,
      totalHosts,
      totalProperties,
      totalVehicles,
      totalBookings,
      totalReviews,
      pendingBookings,
      revenueResult,
    ] = await Promise.all([
      AppDataSource.getRepository(User).count({ where: { role: "user" } }),
      AppDataSource.getRepository(User).count({ where: { role: "host" } }),
      AppDataSource.getRepository(Property).count({ where: { status: "approved" } }),
      AppDataSource.getRepository(Vehicle).count(),
      AppDataSource.getRepository(Booking).count(),
      AppDataSource.getRepository(Review).count(),
      AppDataSource.getRepository(Booking).count({ where: { status: "awaiting_payment" } }),
      AppDataSource.getRepository(Booking)
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
      pendingListings: await AppDataSource.getRepository(Property).count({ where: { status: "pending" } }),
    };
  }

  // ── Users ────────────────────────────────────────────────────

  async getUser(id: string) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) throw new AppError("User not found", 404);
    const { password: _pw, ...safe } = user;
    return safe;
  }

  async getUsers(opts: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    const { page = 1, role, search } = opts;
    const limit = Math.min(opts.limit ?? 20, 100);
    const qb = AppDataSource.getRepository(User)
      .createQueryBuilder("u")
      .orderBy("u.createdAt", "DESC");

    if (role) qb.andWhere("u.role = :role", { role });
    if (search) {
      qb.andWhere(
        "(LOWER(u.email) LIKE :q OR LOWER(u.firstName) LIKE :q OR LOWER(u.lastName) LIKE :q)",
        { q: `%${search.toLowerCase()}%` }
      );
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

  async updateUser(
    id: string,
    updates: Partial<{ role: string; isVerified: boolean; firstName: string; lastName: string; commissionRateOverride: number | null }>
  ) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) throw new AppError("User not found", 404);

    // Guard against promoting to admin through API — only via DB directly
    if (updates.role === "admin") throw new AppError("Cannot set admin role via API", 403);

    Object.assign(user, updates);
    await repo.save(user);
    const { password: _pw, ...safe } = user;
    return safe;
  }

  async deleteUser(id: string) {
    const repo = AppDataSource.getRepository(User);
    const user = await repo.findOne({ where: { id } });
    if (!user) throw new AppError("User not found", 404);
    if (user.role === "admin") throw new AppError("Cannot delete an admin account", 403);
    await repo.remove(user);
  }

  async getHostProperties(hostId: string) {
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: hostId } });
    if (!user) throw new AppError("User not found", 404);
    const properties = await AppDataSource.getRepository(Property).find({
      where: { hostId },
      relations: ["images"],
      order: { createdAt: "DESC" },
    });
    const { password: _pw, ...safeUser } = user;
    return { host: safeUser, properties };
  }

  // ── Properties ───────────────────────────────────────────────

  async getProperties(opts: { page?: number; limit?: number; search?: string; status?: string; isAvailable?: boolean }) {
    const { page = 1, search, status } = opts;
    const limit = Math.min(opts.limit ?? 20, 100);
    const qb = AppDataSource.getRepository(Property)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.host", "host")
      .leftJoinAndSelect("p.images", "images")
      .orderBy("p.createdAt", "DESC");

    if (status) {
      qb.andWhere("p.status = :status", { status });
    }

    if (opts.isAvailable !== undefined) {
      qb.andWhere("p.isAvailable = :isAvail", { isAvail: opts.isAvailable });
    }

    if (search) {
      qb.andWhere(
        "(LOWER(p.title) LIKE :q OR LOWER(p.location->>'city') LIKE :q OR LOWER(host.firstName) LIKE :q OR LOWER(host.lastName) LIKE :q OR LOWER(CONCAT(host.firstName, ' ', host.lastName)) LIKE :q)",
        { q: `%${search.toLowerCase()}%` }
      );
    }

    const total = await qb.getCount();
    const properties = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { properties, total };
  }

  async updateProperty(id: string, updates: Record<string, any>) {
    const repo = AppDataSource.getRepository(Property);
    const property = await repo.findOne({
      where: { id },
      relations: ["host"],
    });
    if (!property) throw new AppError("Property not found", 404);

    const prevStatus = property.status;
    Object.assign(property, updates);
    const saved = await repo.save(property);

    // Fire email when admin approves or rejects
    const newStatus = updates.status as string | undefined;
    if (newStatus && newStatus !== prevStatus && property.host) {
      emailService
        .sendListingStatusUpdate({
          to: property.host.email,
          hostName: property.host.firstName,
          propertyTitle: property.title,
          status: newStatus as "approved" | "rejected",
          rejectionReason: updates.rejectionReason,
          propertyId: id,
        })
        .catch(console.error);
    }

    // In-app notification to host when listing is approved or rejected
    if (newStatus && (newStatus === "approved" || newStatus === "rejected") && newStatus !== prevStatus && property.host) {
      notificationService.send({
        userId: property.host.id,
        type: newStatus === "approved" ? "listing_approved" : "listing_rejected",
        title: newStatus === "approved" ? "Listing approved ✓" : "Listing not approved",
        body: newStatus === "approved"
          ? `Your listing "${property.title}" has been approved and is now live.`
          : `Your listing "${property.title}" was not approved${updates.rejectionReason ? `: ${updates.rejectionReason}` : "."}`,
        data: { url: `/properties/${property.id}`, urlLabel: "View listing" },
      }).catch(console.error);
    }

    return saved;
  }

  async deleteProperty(id: string) {
    const repo = AppDataSource.getRepository(Property);
    const property = await repo.findOne({ where: { id } });
    if (!property) throw new AppError("Property not found", 404);
    await repo.remove(property);
  }

  // ── Vehicles ─────────────────────────────────────────────────

  async getVehicles(opts: { page?: number; limit?: number; search?: string; status?: string; isAvailable?: boolean }) {
    const { page = 1, search } = opts;
    const limit = Math.min(opts.limit ?? 20, 100);
    const qb = AppDataSource.getRepository(Vehicle)
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.host", "host")
      .orderBy("v.createdAt", "DESC");

    if (search) {
      qb.andWhere(
        "(LOWER(v.make) LIKE :q OR LOWER(v.model) LIKE :q OR LOWER(v.location) LIKE :q OR LOWER(host.firstName) LIKE :q OR LOWER(host.lastName) LIKE :q OR LOWER(CONCAT(host.firstName, ' ', host.lastName)) LIKE :q)",
        { q: `%${search.toLowerCase()}%` }
      );
    }

    if (opts.status) {
      qb.andWhere("v.status = :vstatus", { vstatus: opts.status });
    }

    if (opts.isAvailable !== undefined) {
      qb.andWhere("v.isAvailable = :isAvail", { isAvail: opts.isAvailable });
    }

    const total = await qb.getCount();
    const vehicles = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { vehicles, total };
  }

  async updateVehicle(id: string, updates: Record<string, any>) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id }, relations: ["host"] });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    const prevStatus = vehicle.status;
    Object.assign(vehicle, updates);
    const saved = await repo.save(vehicle);

    const newStatus = updates.status as string | undefined;
    if (newStatus && newStatus !== prevStatus && vehicle.host) {
      emailService
        .sendVehicleStatusUpdate({
          to: vehicle.host.email,
          hostName: vehicle.host.firstName,
          vehicleTitle: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          status: newStatus as "approved" | "rejected",
          rejectionReason: updates.rejectionReason,
          vehicleId: id,
        })
        .catch(console.error);
    }

    return saved;
  }

  async deleteVehicle(id: string) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    await repo.remove(vehicle);
  }

  // ── Bookings ─────────────────────────────────────────────────

  async getBookings(opts: { page?: number; limit?: number; status?: string }) {
    const { page = 1, status } = opts;
    const limit = Math.min(opts.limit ?? 20, 100);
    const qb = AppDataSource.getRepository(Booking)
      .createQueryBuilder("b")
      .leftJoinAndSelect("b.user", "user")
      .leftJoinAndSelect("b.property", "property")
      .orderBy("b.createdAt", "DESC");

    if (status) qb.andWhere("b.status = :status", { status });

    const total = await qb.getCount();
    const bookings = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { bookings, total };
  }

  async verifyBookingPayment(id: string): Promise<Booking> {
    const repo = AppDataSource.getRepository(Booking);
    const booking = await repo.findOne({ where: { id } });
    if (!booking) throw new AppError("Booking not found", 404);
    if (!booking.paystackReference) throw new AppError("This booking has no Paystack reference to verify", 400);
    // Delegates to paymentService which calls Paystack and updates booking status
    return paymentService.verifyPayment(booking.paystackReference);
  }

  async updateBookingStatus(id: string, status: string) {
    const repo = AppDataSource.getRepository(Booking);
    const booking = await repo.findOne({
      where: { id },
      relations: ["user", "property"],
    });
    if (!booking) throw new AppError("Booking not found", 404);

    booking.status = status as any;
    const saved = await repo.save(booking);

    // Fire status email (best-effort)
    emailService
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

  async deleteReview(id: string) {
    const repo = AppDataSource.getRepository(Review);
    const review = await repo.findOne({ where: { id } });
    if (!review) throw new AppError("Review not found", 404);
    await repo.remove(review);
  }

  // ── Email broadcast ──────────────────────────────────────────

  async getAudienceRecipients(
    audience: "all" | "users" | "hosts" | "verified_hosts" | "unverified_hosts" | "guests_with_bookings"
  ): Promise<User[]> {
    const repo = AppDataSource.getRepository(User);

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

  async previewAudienceCount(
    audience: "all" | "users" | "hosts" | "verified_hosts" | "unverified_hosts" | "guests_with_bookings"
  ) {
    const recipients = await this.getAudienceRecipients(audience);
    return { count: recipients.length };
  }

  async sendDirectEmail(opts: { userId: string; subject: string; message: string }) {
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: opts.userId } });
    if (!user) throw new AppError("User not found", 404);
    await emailService.sendAdminBroadcast({
      to: user.email,
      subject: opts.subject,
      message: opts.message,
    });
  }

  async sendBroadcast(opts: {
    audience: "all" | "users" | "hosts" | "verified_hosts" | "unverified_hosts" | "guests_with_bookings";
    subject: string;
    message?: string;
    htmlBody?: string; // Rich HTML content (wrapped in brand template)
  }) {
    const { audience, subject, message, htmlBody } = opts;
    const recipients = await this.getAudienceRecipients(audience);

    const sends = recipients.map((u) => {
      if (htmlBody) {
        return emailService
          .sendCampaign({ to: u.email, firstName: u.firstName, subject, htmlBody })
          .catch(console.error);
      }
      return emailService
        .sendAdminBroadcast({ to: u.email, subject, message: message ?? "" })
        .catch(console.error);
    });
    await Promise.all(sends);

    return { sent: recipients.length };
  }
}

export const adminService = new AdminService();
