import { Request, Response, NextFunction } from "express";
import { SubscriptionTier } from "../constants/subscriptionTiers";
/**
 * Middleware factory that gates a route behind a minimum subscription tier.
 *
 * Usage:
 *   router.post("/feature-video", protect, requireTier("pro"), uploadVideo, controller)
 */
export declare function requireTier(minimumTier: SubscriptionTier): (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=requireTier.d.ts.map