"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.iamService = void 0;
// src/services/iamService.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const AdminAuditLog_1 = require("../entities/AdminAuditLog");
const AppError_1 = require("../utils/AppError");
const emailService_1 = require("./emailService");
class IamService {
    constructor() {
        this.userRepo = database_1.AppDataSource.getRepository(User_1.User);
        this.auditRepo = database_1.AppDataSource.getRepository(AdminAuditLog_1.AdminAuditLog);
    }
    // ── Admin management ────────────────────────────────────────────────────
    async listAdmins() {
        const admins = await this.userRepo.find({
            where: { role: "admin" },
            order: { createdAt: "ASC" },
        });
        return admins.map(({ password: _pw, ...a }) => a);
    }
    async createAdmin(opts) {
        const existing = await this.userRepo.findOne({ where: { email: opts.email } });
        if (existing)
            throw new AppError_1.AppError("An account with this email already exists.", 409);
        // Random placeholder password — will be replaced when the invite link is used
        const placeholder = await bcryptjs_1.default.hash(crypto_1.default.randomBytes(32).toString("hex"), 12);
        const admin = this.userRepo.create({
            ...opts,
            password: placeholder,
            role: "admin",
            isSuperAdmin: false,
            isEmailVerified: true,
        });
        const saved = await this.userRepo.save(admin);
        // Generate a 72-hour "set your password" token and email the invite
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        saved.passwordResetToken = hashedToken;
        saved.passwordResetExpires = new Date(Date.now() + 72 * 60 * 60 * 1000);
        await this.userRepo.save(saved);
        const base = process.env.APP_URL || (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();
        emailService_1.emailService.sendAdminInvite(saved.email, saved.firstName, `${base}/reset-password/${token}`).catch(console.error);
        const { password: _pw, ...safe } = saved;
        return safe;
    }
    async updateAdminPermissions(id, adminPermissions) {
        const admin = await this.userRepo.findOne({ where: { id, role: "admin" } });
        if (!admin)
            throw new AppError_1.AppError("Admin not found", 404);
        if (admin.isSuperAdmin)
            throw new AppError_1.AppError("Cannot modify super-admin permissions", 403);
        admin.adminPermissions = adminPermissions;
        await this.userRepo.save(admin);
        const { password: _pw, ...safe } = admin;
        return safe;
    }
    async revokeAdmin(id, requesterId) {
        if (id === requesterId)
            throw new AppError_1.AppError("Cannot revoke your own admin access", 403);
        const admin = await this.userRepo.findOne({ where: { id, role: "admin" } });
        if (!admin)
            throw new AppError_1.AppError("Admin not found", 404);
        if (admin.isSuperAdmin)
            throw new AppError_1.AppError("Cannot revoke a super-admin account", 403);
        admin.role = "user";
        admin.adminPermissions = null;
        await this.userRepo.save(admin);
    }
    // ── Audit logging ────────────────────────────────────────────────────────
    async logAction(opts) {
        const entry = this.auditRepo.create(opts);
        await this.auditRepo.save(entry);
    }
    async getAuditLogs(opts) {
        const { page = 1, adminId, action } = opts;
        const limit = Math.min(opts.limit ?? 20, 100);
        const qb = this.auditRepo
            .createQueryBuilder("log")
            .orderBy("log.createdAt", "DESC");
        if (adminId)
            qb.andWhere("log.adminId = :adminId", { adminId });
        if (action)
            qb.andWhere("log.action ILIKE :action", { action: `%${action}%` });
        const total = await qb.getCount();
        const logs = await qb.skip((page - 1) * limit).take(limit).getMany();
        return { logs, total };
    }
}
exports.iamService = new IamService();
//# sourceMappingURL=iamService.js.map