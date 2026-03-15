// src/services/authServices.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
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

    // Fire welcome email (best-effort — don't fail registration if email fails)
    emailService.sendWelcome(savedUser.email, savedUser.firstName).catch(console.error);

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
}
