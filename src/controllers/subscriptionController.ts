// src/controllers/subscriptionController.ts
import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { subscriptionService } from "../services/subscriptionService";
import { AppError } from "../utils/AppError";
import { SubscriptionTier, BillingCycle, TIER_CONFIG } from "../constants/subscriptionTiers";

export const subscriptionController = {
  /** GET /api/subscriptions/me — returns the host's current subscription + tier config */
  getMySubscription: catchAsync(async (req: Request, res: Response) => {
    const subscription = await subscriptionService.getSubscriptionForHost(req.user.id);
    res.json({
      status: "success",
      data: {
        subscription,
        currentTier: req.user.subscriptionTier ?? "starter",
        tierConfig: TIER_CONFIG,
      },
    });
  }),

  /** POST /api/subscriptions/initiate — starts Paystack checkout for a plan */
  initiateSubscription: catchAsync(async (req: Request, res: Response) => {
    const { tier, billingCycle } = req.body as { tier: SubscriptionTier; billingCycle: BillingCycle };

    if (!tier || !["pro", "elite"].includes(tier)) {
      throw new AppError("tier must be 'pro' or 'elite'", 400);
    }
    if (!billingCycle || !["monthly", "annual"].includes(billingCycle)) {
      throw new AppError("billingCycle must be 'monthly' or 'annual'", 400);
    }

    const result = await subscriptionService.initiateSubscription(req.user, tier, billingCycle);
    res.json({ status: "success", data: result });
  }),

  /** DELETE /api/subscriptions/cancel — cancels the active subscription */
  cancelSubscription: catchAsync(async (req: Request, res: Response) => {
    await subscriptionService.cancelSubscription(req.user.id);
    res.json({ status: "success", data: null });
  }),

  /** GET /api/subscriptions/tiers — public, returns tier config for UI */
  getTierConfig: catchAsync(async (_req: Request, res: Response) => {
    res.json({ status: "success", data: { tiers: TIER_CONFIG } });
  }),
};
