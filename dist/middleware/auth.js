"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.restrictTo = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const RevokedToken_1 = require("../entities/RevokedToken");
const AppError_1 = require("../utils/AppError");
const catchAsync_1 = require("../utils/catchAsync");
exports.protect = (0, catchAsync_1.catchAsync)(async (req, _res, next) => {
    // 1) Extract token
    let token;
    if (req.headers.authorization?.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
        return next(new AppError_1.AppError("You are not logged in. Please log in to get access.", 401));
    }
    // 2) Verify signature
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new AppError_1.AppError("JWT secret is not configured", 500);
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    // 3) Check token blacklist
    const tokenHash = crypto_1.default.createHash("sha256").update(token).digest("hex");
    const revoked = await database_1.AppDataSource.getRepository(RevokedToken_1.RevokedToken).findOne({ where: { tokenHash } });
    if (revoked) {
        return next(new AppError_1.AppError("This session has been logged out. Please log in again.", 401));
    }
    // Opportunistic cleanup of expired revoked tokens (~1% of requests)
    if (Math.random() < 0.01) {
        database_1.AppDataSource.getRepository(RevokedToken_1.RevokedToken)
            .createQueryBuilder()
            .delete()
            .where('"expiresAt" < NOW()')
            .execute()
            .catch(() => { });
    }
    // 4) Check user still exists
    const currentUser = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: decoded.id } });
    if (!currentUser) {
        return next(new AppError_1.AppError("The user belonging to this token no longer exists.", 401));
    }
    // 5) Attach to request
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
/**
 * Checks that the logged-in admin has ALL of the specified permissions.
 * Super-admins (isSuperAdmin = true OR adminPermissions = null) bypass all checks.
 */
const hasPermission = (...permissions) => {
    return (req, _res, next) => {
        const user = req.user;
        if (!user)
            return next(new AppError_1.AppError("Not authenticated.", 401));
        // Super-admin bypass
        if (user.isSuperAdmin || user.adminPermissions === null)
            return next();
        const missing = permissions.filter((p) => !user.adminPermissions.includes(p));
        if (missing.length > 0) {
            return next(new AppError_1.AppError("You don't have permission to perform this action.", 403));
        }
        next();
    };
};
exports.hasPermission = hasPermission;
//# sourceMappingURL=auth.js.map