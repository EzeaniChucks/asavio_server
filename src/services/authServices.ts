// src/services/authServices.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { RevokedToken } from "../entities/RevokedToken";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: "user" | "host";
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new AppError("JWT secret is not configured", 500);

  return jwt.sign({ id }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  } as jwt.SignOptions);
};

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(input: RegisterInput) {
    const existing = await this.userRepository.findOne({
      where: { email: input.email },
    });

    if (existing) {
      throw new AppError("An account with this email already exists.", 409);
    }

    const hashedPassword = await bcrypt.hash(input.password, 12);

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
    emailService.sendWelcome(savedUser.email, savedUser.firstName).catch(console.error);
    this.sendEmailVerification(savedUser.id).catch(console.error);

    // Strip password before returning
    const { password: _pw, ...userWithoutPassword } = savedUser;

    return { user: userWithoutPassword, token };
  }

  async login(input: LoginInput) {
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

    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError("Incorrect email or password.", 401);
    }

    const token = signToken(user.id);
    const { password: _pw, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["properties", "bookings"],
    });

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    const { password: _pw, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfile(userId: string, updateData: Partial<User>) {
    // Prevent sensitive fields from being updated via this method
    const { password, role, isVerified, ...safeData } = updateData as any;

    await this.userRepository.update(userId, safeData);

    return this.getProfile(userId);
  }

  async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    // Silent return — never reveal whether the email exists
    if (!user) return;

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.userRepository.save(user);

    const base = (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();
    const resetUrl = `${base}/reset-password/${token}`;

    await emailService.sendPasswordReset(user.email, user.firstName, resetUrl).catch(console.error);
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordResetToken")
      .addSelect("user.passwordResetExpires")
      .where("user.passwordResetToken = :hashedToken", { hashedToken })
      .getOne();

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      throw new AppError("Reset link is invalid or has expired", 400);
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = null!;
    user.passwordResetExpires = null;
    await this.userRepository.save(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :userId", { userId })
      .getOne();

    if (!user) throw new AppError("User not found", 404);

    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) throw new AppError("Current password is incorrect", 401);

    user.password = await bcrypt.hash(newPassword, 12);
    await this.userRepository.save(user);
  }

  async logout(token: string, userId: string) {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (!decoded?.exp) return;

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const repo = AppDataSource.getRepository(RevokedToken);

    const existing = await repo.findOne({ where: { tokenHash } });
    if (!existing) {
      await repo.save(
        repo.create({ tokenHash, userId, expiresAt: new Date(decoded.exp * 1000) })
      );
    }
  }

  async sendEmailVerification(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.isEmailVerified) return;

    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
    await this.userRepository.save(user);

    const base = (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();
    const verifyUrl = `${base}/verify-email/${token}`;

    await emailService.sendVerificationEmail(user.email, user.firstName, verifyUrl);
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.emailVerificationToken")
      .addSelect("user.emailVerificationExpires")
      .where("user.emailVerificationToken = :hashedToken", { hashedToken })
      .getOne();

    if (!user || !user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
      throw new AppError("Verification link is invalid or has expired.", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null!;
    user.emailVerificationExpires = null;
    await this.userRepository.save(user);
  }

  async changeEmail(userId: string, password: string, newEmail: string) {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :userId", { userId })
      .getOne();

    if (!user) throw new AppError("User not found", 404);

    const isCorrect = await bcrypt.compare(password, user.password);
    if (!isCorrect) throw new AppError("Password is incorrect", 401);

    const existing = await this.userRepository.findOne({ where: { email: newEmail } });
    if (existing) throw new AppError("This email is already in use", 409);

    user.email = newEmail;
    await this.userRepository.save(user);

    return this.getProfile(userId);
  }
}
