"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.protect = (0, catchAsync_1.catchAsync)(async (req, _res, next) => {
    // 1) Get token from Authorization header
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new AppError_1.AppError("You are not logged in. Please log in to get access.", 401));
    }
    // 2) Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new AppError_1.AppError("JWT secret is not configured", 500);
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    // 3) Check if user still exists
    const userRepository = database_1.AppDataSource.getRepository(User_1.User);
    const currentUser = await userRepository.findOne({
        where: { id: decoded.id },
    });
    if (!currentUser) {
        return next(new AppError_1.AppError("The user belonging to this token no longer exists.", 401));
    }
    // 4) Attach user to request
    req.user = currentUser;
    next();
});
const restrictTo = (...roles) => {
    return (req, _res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError_1.AppError("You do not have permission to perform this action.", 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
//# sourceMappingURL=auth.js.map