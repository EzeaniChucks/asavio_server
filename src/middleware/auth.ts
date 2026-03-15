// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

interface JwtPayload {
  id: string;
  iat: number;
  exp: number;
}

export const protect = catchAsync(
  async (req: Request, _res: Response, next: NextFunction) => {
    // 1) Get token from Authorization header
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("You are not logged in. Please log in to get access.", 401)
      );
    }

    // 2) Verify token
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError("JWT secret is not configured", 500);

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // 3) Check if user still exists
    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({
      where: { id: decoded.id },
    });

    if (!currentUser) {
      return next(
        new AppError("The user belonging to this token no longer exists.", 401)
      );
    }

    // 4) Attach user to request
    req.user = currentUser;
    next();
  }
);

export const restrictTo = (...roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action.", 403)
      );
    }
    next();
  };
};
