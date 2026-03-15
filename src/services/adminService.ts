// src/services/adminService.ts
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { Vehicle } from "../entities/Vehicle";
import { Booking } from "../entities/Booking";
import { Review } from "../entities/Review";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";

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
      AppDataSource.getRepository(Property).count(),
      AppDataSource.getRepository(Vehicle).count(),
      AppDataSource.getRepository(Booking).count(),
      AppDataSource.getRepository(Review).count(),
      AppDataSource.getRepository(Booking).count({ where: { status: "pending" } }),
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
    };
  }

  // ── Users ────────────────────────────────────────────────────

  async getUsers(opts: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }) {
    const { page = 1, limit = 20, role, search } = opts;
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
    updates: Partial<{ role: string; isVerified: boolean; firstName: string; lastName: string }>
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

  // ── Properties ───────────────────────────────────────────────

  async getProperties(opts: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = opts;
    const qb = AppDataSource.getRepository(Property)
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.host", "host")
      .leftJoinAndSelect("p.images", "images")
      .orderBy("p.createdAt", "DESC");

    if (search) {
      qb.andWhere(
        "(LOWER(p.title) LIKE :q OR LOWER(p.location->>'city') LIKE :q)",
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

  async updateProperty(id: string, updates: Partial<{ isAvailable: boolean; title: string }>) {
    const repo = AppDataSource.getRepository(Property);
    const property = await repo.findOne({ where: { id } });
    if (!property) throw new AppError("Property not found", 404);
    Object.assign(property, updates);
    return repo.save(property);
  }

  async deleteProperty(id: string) {
    const repo = AppDataSource.getRepository(Property);
    const property = await repo.findOne({ where: { id } });
    if (!property) throw new AppError("Property not found", 404);
    await repo.remove(property);
  }

  // ── Vehicles ─────────────────────────────────────────────────

  async getVehicles(opts: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 20, search } = opts;
    const qb = AppDataSource.getRepository(Vehicle)
      .createQueryBuilder("v")
      .leftJoinAndSelect("v.host", "host")
      .orderBy("v.createdAt", "DESC");

    if (search) {
      qb.andWhere(
        "(LOWER(v.make) LIKE :q OR LOWER(v.model) LIKE :q OR LOWER(v.location) LIKE :q)",
        { q: `%${search.toLowerCase()}%` }
      );
    }

    const total = await qb.getCount();
    const vehicles = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { vehicles, total };
  }

  async deleteVehicle(id: string) {
    const repo = AppDataSource.getRepository(Vehicle);
    const vehicle = await repo.findOne({ where: { id } });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    await repo.remove(vehicle);
  }

  // ── Bookings ─────────────────────────────────────────────────

  async getBookings(opts: { page?: number; limit?: number; status?: string }) {
    const { page = 1, limit = 20, status } = opts;
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
        propertyTitle: booking.property.title,
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

  async sendBroadcast(opts: {
    audience: "all" | "hosts" | "users";
    subject: string;
    message: string;
  }) {
    const { audience, subject, message } = opts;
    const repo = AppDataSource.getRepository(User);

    let where: Record<string, string> | undefined;
    if (audience === "hosts") where = { role: "host" };
    else if (audience === "users") where = { role: "user" };

    const recipients = await repo.find({ where });

    const sends = recipients.map((u) =>
      emailService
        .sendAdminBroadcast({ to: u.email, subject, message })
        .catch(console.error)
    );
    await Promise.all(sends);

    return { sent: recipients.length };
  }
}

export const adminService = new AdminService();
