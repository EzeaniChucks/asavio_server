"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/services/authServices.ts
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
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
        // Fire welcome email (best-effort — don't fail registration if email fails)
        emailService_1.emailService.sendWelcome(savedUser.email, savedUser.firstName).catch(console.error);
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
}
exports.AuthService = AuthService;
//# sourceMappingURL=authServices.js.map