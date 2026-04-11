import { Request, Response, NextFunction } from "express";
import { SubscriptionTier } from "../constants/subscriptionTiers";
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
export declare function requireTier(minimumTier: SubscriptionTier): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=requireTier.d.ts.map