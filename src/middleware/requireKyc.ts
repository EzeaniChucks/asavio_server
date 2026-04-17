// src/middleware/requireKyc.ts
// Blocks listing creation (property, vehicle, hotel, event center) unless the
// host has submitted KYC. Rejected and not-submitted are both blocked.
// Admins bypass the check.

import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export const requireKyc = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) return next(new AppError("Not authenticated.", 401));

  // Admins never need KYC
  if (user.role === "admin") return next();

  const status = user.kycStatus ?? "not_submitted";

  if (status === "not_submitted") {
    return next(
      new AppError(
        "Please submit your identity verification (KYC) before creating a listing. Go to Account Settings → KYC to upload your documents.",
        403
      )
    );
  }

  if (status === "rejected") {
    return next(
      new AppError(
        "Your KYC was rejected. Please resubmit your documents in Account Settings before creating a listing.",
        403
      )
    );
  }

  // "pending" or "approved" — allow
  next();
};
