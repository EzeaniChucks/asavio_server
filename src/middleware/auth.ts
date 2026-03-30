// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { RevokedToken } from "../entities/RevokedToken";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export const protect = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    // 1) Extract token
    let token: string | undefined;
    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return next(new AppError("You are not logged in. Please log in to get access.", 401));
    }

    // 2) Verify signature
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError("JWT secret is not configured", 500);
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // 3) Check token blacklist
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const revoked = await AppDataSource.getRepository(RevokedToken).findOne({ where: { tokenHash } });
    if (revoked) {
      return next(new AppError("This session has been logged out. Please log in again.", 401));
    }

    // Opportunistic cleanup of expired revoked tokens (~1% of requests)
    if (Math.random() < 0.01) {
      AppDataSource.getRepository(RevokedToken)
        .createQueryBuilder()
        .delete()
        .where('"expiresAt" < NOW()')
        .execute()
        .catch(() => {});
    }

    // 4) Check user still exists
    const currentUser = await AppDataSource.getRepository(User).findOne({ where: { id: decoded.id } });
    if (!currentUser) {
      return next(new AppError("The user belonging to this token no longer exists.", 401));
    }

    // 5) Attach to request
    req.user = currentUser;
    next();
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
};

/**
 * Checks that the logged-in admin has ALL of the specified permissions.
 * Super-admins (isSuperAdmin = true OR adminPermissions = null) bypass all checks.
 */
export const hasPermission = (...permissions: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return next(new AppError("Not authenticated.", 401));

    // Super-admin bypass
    if (user.isSuperAdmin || user.adminPermissions === null) return next();

    const missing = permissions.filter((p) => !user.adminPermissions!.includes(p));
    if (missing.length > 0) {
      return next(new AppError("You don't have permission to perform this action.", 403));
    }
    next();
  };
};
