// src/middleware/requireTier.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { SubscriptionTier, tierMeetsMinimum } from "../constants/subscriptionTiers";
import { settingsService } from "../services/settingsService";
import { AppDataSource } from "../config/database";
import { Subscription } from "../entities/Subscription";

/**
 * Middleware factory that gates a route behind a minimum subscription tier.
 *
 * Also performs a lightweight safety check: if the user is on a paid tier but
 * their subscription is cancelled and past its period end, it downgrades them
 * to Starter even if the Paystack webhook hasn't fired yet.
 *
 * Usage:
 *   router.post("/feature-video", protect, requireTier("pro"), uploadVideo, controller)
 */
export function requireTier(minimumTier: SubscriptionTier) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const config = await settingsService.getActiveTierConfig();
    let hostTier: SubscriptionTier = (req.user?.subscriptionTier as SubscriptionTier) ?? "starter";

    // Safety net: if on a paid tier, verify period hasn't silently expired
    if (hostTier !== "starter") {
      const sub = await AppDataSource.getRepository(Subscription).findOne({
        where: { hostId: req.user.id },
        order: { createdAt: "DESC" },
      });
      if (
        sub &&
        (sub.status === "expired" ||
          (sub.status === "cancelled" && new Date(sub.currentPeriodEnd) < new Date()))
      ) {
        hostTier = "starter";
        // Lazily sync the denormalized column so subsequent checks are fast
        AppDataSource.getRepository("users")
          .update(req.user.id, { subscriptionTier: "starter" })
          .catch(console.error);
      }
    }

    if (!tierMeetsMinimum(hostTier, minimumTier)) {
      return next(
        new AppError(
          `This feature requires the ${config[minimumTier].label} plan or higher. ` +
            `Your current plan is ${config[hostTier].label}.`,
          403
        )
      );
    }
    next();
  };
}
