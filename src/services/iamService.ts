// src/services/iamService.ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AdminAuditLog } from "../entities/AdminAuditLog";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";
import type { AdminPermission } from "../constants/permissions";

class IamService {
  private userRepo = AppDataSource.getRepository(User);
  private auditRepo = AppDataSource.getRepository(AdminAuditLog);

  // ── Admin management ────────────────────────────────────────────────────

  async listAdmins() {
    const admins = await this.userRepo.find({
      where: { role: "admin" },
      order: { createdAt: "ASC" },
    });
    return admins.map(({ password: _pw, ...a }) => a);
  }

  async createAdmin(opts: {
    email: string;
    firstName: string;
    lastName: string;
    adminPermissions: AdminPermission[];
  }) {
    const existing = await this.userRepo.findOne({ where: { email: opts.email } });
    if (existing) throw new AppError("An account with this email already exists.", 409);

    // Random placeholder password — will be replaced when the invite link is used
    const placeholder = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
    const admin = this.userRepo.create({
      ...opts,
      password: placeholder,
      role: "admin",
      isSuperAdmin: false,
      isEmailVerified: true,
    });
    const saved = await this.userRepo.save(admin);

    // Generate a 72-hour "set your password" token and email the invite
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    saved.passwordResetToken = hashedToken;
    saved.passwordResetExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await this.userRepo.save(saved);

    const base = process.env.APP_URL || (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();
    emailService.sendAdminInvite(saved.email, saved.firstName, `${base}/reset-password/${token}`).catch(console.error);

    const { password: _pw, ...safe } = saved;
    return safe;
  }

  async updateAdminPermissions(id: string, adminPermissions: AdminPermission[]) {
    const admin = await this.userRepo.findOne({ where: { id, role: "admin" } });
    if (!admin) throw new AppError("Admin not found", 404);
    if (admin.isSuperAdmin) throw new AppError("Cannot modify super-admin permissions", 403);

    admin.adminPermissions = adminPermissions;
    await this.userRepo.save(admin);
    const { password: _pw, ...safe } = admin;
    return safe;
  }

  async revokeAdmin(id: string, requesterId: string) {
    if (id === requesterId) throw new AppError("Cannot revoke your own admin access", 403);
    const admin = await this.userRepo.findOne({ where: { id, role: "admin" } });
    if (!admin) throw new AppError("Admin not found", 404);
    if (admin.isSuperAdmin) throw new AppError("Cannot revoke a super-admin account", 403);

    admin.role = "user";
    admin.adminPermissions = null;
    await this.userRepo.save(admin);
  }

  // ── Audit logging ────────────────────────────────────────────────────────

  async logAction(opts: {
    adminId: string;
    adminEmail: string;
    adminName: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: Record<string, any>;
  }) {
    const entry = this.auditRepo.create(opts);
    await this.auditRepo.save(entry);
  }

  async getAuditLogs(opts: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: string;
  }) {
    const { page = 1, adminId, action } = opts;
    const limit = Math.min(opts.limit ?? 20, 100);

    const qb = this.auditRepo
      .createQueryBuilder("log")
      .orderBy("log.createdAt", "DESC");

    if (adminId) qb.andWhere("log.adminId = :adminId", { adminId });
    if (action) qb.andWhere("log.action ILIKE :action", { action: `%${action}%` });

    const total = await qb.getCount();
    const logs = await qb.skip((page - 1) * limit).take(limit).getMany();

    return { logs, total };
  }
}

export const iamService = new IamService();
