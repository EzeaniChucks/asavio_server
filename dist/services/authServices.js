"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/authServices.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const RevokedToken_1 = require("../entities/RevokedToken");
const AppError_1 = require("../utils/AppError");
const emailService_1 = require("./emailService");
const signToken = (id) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new AppError_1.AppError("JWT secret is not configured", 500);
    return jsonwebtoken_1.default.sign({ id }, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};
class AuthService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
    }
    async register(input) {
        const existing = await this.userRepository.findOne({
            where: { email: input.email },
        });
        if (existing) {
            throw new AppError_1.AppError("An account with this email already exists.", 409);
        }
        const hashedPassword = await bcryptjs_1.default.hash(input.password, 12);
        const user = this.userRepository.create({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            password: hashedPassword,
            role: input.role || "user",
            phone: input.phone,
        });
        const savedUser = await this.userRepository.save(user);
        const token = signToken(savedUser.id);
        // Fire welcome + verification emails (best-effort)
        emailService_1.emailService.sendWelcome(savedUser.email, savedUser.firstName).catch(console.error);
        this.sendEmailVerification(savedUser.id).catch(console.error);
        // Strip password before returning
        const { password: _pw, ...userWithoutPassword } = savedUser;
        return { user: userWithoutPassword, token };
    }
    async login(input) {
        const user = await this.userRepository.findOne({
            where: { email: input.email },
            select: [
                "id",
                "email",
                "password",
                "firstName",
                "lastName",
                "role",
                "isVerified",
                "profileImage",
                "phone",
                "createdAt",
                "updatedAt",
            ],
        });
        if (!user || !(await bcryptjs_1.default.compare(input.password, user.password))) {
            throw new AppError_1.AppError("Incorrect email or password.", 401);
        }
        const token = signToken(user.id);
        const { password: _pw, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["properties", "bookings"],
        });
        if (!user) {
            throw new AppError_1.AppError("User not found.", 404);
        }
        const { password: _pw, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async updateProfile(userId, updateData) {
        // Prevent sensitive fields from being updated via this method
        const { password, role, isVerified, ...safeData } = updateData;
        await this.userRepository.update(userId, safeData);
        return this.getProfile(userId);
    }
    async forgotPassword(email) {
        const user = await this.userRepository.findOne({ where: { email } });
        // Silent return — never reveal whether the email exists
        if (!user)
            return;
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await this.userRepository.save(user);
        const base = (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();
        const resetUrl = `${base}/reset-password/${token}`;
        await emailService_1.emailService.sendPasswordReset(user.email, user.firstName, resetUrl).catch(console.error);
    }
    async resetPassword(token, newPassword) {
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await this.userRepository
            .createQueryBuilder("user")
            .addSelect("user.passwordResetToken")
            .addSelect("user.passwordResetExpires")
            .where("user.passwordResetToken = :hashedToken", { hashedToken })
            .getOne();
        if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
            throw new AppError_1.AppError("Reset link is invalid or has expired", 400);
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 12);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await this.userRepository.save(user);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository
            .createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.id = :userId", { userId })
            .getOne();
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const isCorrect = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCorrect)
            throw new AppError_1.AppError("Current password is incorrect", 401);
        user.password = await bcryptjs_1.default.hash(newPassword, 12);
        await this.userRepository.save(user);
    }
    async logout(token, userId) {
        const decoded = jsonwebtoken_1.default.decode(token);
        if (!decoded?.exp)
            return;
        const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const repo = database_1.AppDataSource.getRepository(RevokedToken_1.RevokedToken);
        const existing = await repo.findOne({ where: { tokenHash } });
        if (!existing) {
            await repo.save(repo.create({ tokenHash, userId, expiresAt: new Date(decoded.exp * 1000) }));
        }
    }
    async sendEmailVerification(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user || user.isEmailVerified)
            return;
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        user.emailVerificationToken = hashedToken;
        user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
        await this.userRepository.save(user);
        const base = (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();
        const verifyUrl = `${base}/verify-email/${token}`;
        await emailService_1.emailService.sendVerificationEmail(user.email, user.firstName, verifyUrl);
    }
    async verifyEmail(token) {
        const hashedToken = crypto_1.default.createHash("sha256").update(token).digest("hex");
        const user = await this.userRepository
            .createQueryBuilder("user")
            .addSelect("user.emailVerificationToken")
            .addSelect("user.emailVerificationExpires")
            .where("user.emailVerificationToken = :hashedToken", { hashedToken })
            .getOne();
        if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
            throw new AppError_1.AppError("Verification link is invalid or has expired.", 400);
        }
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await this.userRepository.save(user);
    }
    async changeEmail(userId, password, newEmail) {
        const user = await this.userRepository
            .createQueryBuilder("user")
            .addSelect("user.password")
            .where("user.id = :userId", { userId })
            .getOne();
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const isCorrect = await bcryptjs_1.default.compare(password, user.password);
        if (!isCorrect)
            throw new AppError_1.AppError("Password is incorrect", 401);
        const existing = await this.userRepository.findOne({ where: { email: newEmail } });
        if (existing)
            throw new AppError_1.AppError("This email is already in use", 409);
        user.email = newEmail;
        await this.userRepository.save(user);
        return this.getProfile(userId);
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authServices.js.map