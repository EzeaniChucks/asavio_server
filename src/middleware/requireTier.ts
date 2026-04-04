// src/middleware/requireTier.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { SubscriptionTier, tierMeetsMinimum, TIER_CONFIG } from "../constants/subscriptionTiers";

/**
 * Middleware factory that gates a route behind a minimum subscription tier.
 *
 * Usage:
 *   router.post("/feature-video", protect, requireTier("pro"), uploadVideo, controller)
 */
export function requireTier(minimumTier: SubscriptionTier) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const hostTier: SubscriptionTier = (req.user?.subscriptionTier as SubscriptionTier) ?? "starter";

    if (!tierMeetsMinimum(hostTier, minimumTier)) {
      return next(
        new AppError(
          `This feature requires the ${TIER_CONFIG[minimumTier].label} plan or higher. ` +
            `Your current plan is ${TIER_CONFIG[hostTier].label}.`,
          403
        )
      );
    }
    next();
  };
}
