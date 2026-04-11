// src/controllers/subscriptionController.ts
import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { subscriptionService } from "../services/subscriptionService";
import { settingsService } from "../services/settingsService";
import { AppError } from "../utils/AppError";
import { SubscriptionTier, BillingCycle } from "../constants/subscriptionTiers";

export const subscriptionController = {
  /** GET /api/subscriptions/me — returns the host's current subscription + tier config */
  getMySubscription: catchAsync(async (req: Request, res: Response) => {
    const [subscription, tierConfig] = await Promise.all([
      subscriptionService.getSubscriptionForHost(req.user.id),
      settingsService.getActiveTierConfig(),
    ]);
    res.json({
      status: "success",
      data: {
        subscription,
        currentTier: req.user.subscriptionTier ?? "starter",
        tierConfig,
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

  /**
   * POST /api/subscriptions/verify
   * Called by the frontend after Paystack's callback redirect.
   * Verifies the payment with Paystack and activates the subscription if the
   * webhook hasn't already done so. Safe to call multiple times (idempotent).
   */
  verifySubscription: catchAsync(async (req: Request, res: Response) => {
    const { reference } = req.body as { reference?: string };
    if (!reference || typeof reference !== "string") {
      throw new AppError("reference is required", 400);
    }
    const { tier, alreadyActive } = await subscriptionService.verifyAndActivate(reference);
    res.json({ status: "success", data: { tier, alreadyActive } });
  }),

  /** DELETE /api/subscriptions/cancel — cancels the active subscription */
  cancelSubscription: catchAsync(async (req: Request, res: Response) => {
    await subscriptionService.cancelSubscription(req.user.id);
    res.json({ status: "success", data: null });
  }),

  /** GET /api/subscriptions/tiers — public, returns tier config for UI */
  getTierConfig: catchAsync(async (_req: Request, res: Response) => {
    const tiers = await settingsService.getActiveTierConfig();
    res.json({ status: "success", data: { tiers } });
  }),

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** GET /api/subscriptions/admin — paginated list of all subscriptions */
  adminListSubscriptions: catchAsync(async (req: Request, res: Response) => {
    const { page, limit, status, tier } = req.query;
    const result = await subscriptionService.adminListSubscriptions({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      status: status as string,
      tier: tier as string,
    });
    res.json({ status: "success", data: result });
  }),

  /** GET /api/subscriptions/admin/stats */
  adminGetStats: catchAsync(async (_req: Request, res: Response) => {
    const stats = await subscriptionService.adminGetStats();
    res.json({ status: "success", data: { stats } });
  }),

  /** DELETE /api/subscriptions/admin/:id — force-cancel any subscription */
  adminCancelSubscription: catchAsync(async (req: Request, res: Response) => {
    await subscriptionService.adminCancelSubscription(req.params.id as string);
    res.status(204).send();
  }),

  /** GET /api/subscriptions/admin/tier-config — current active tier config (DB + defaults) */
  adminGetTierConfig: catchAsync(async (_req: Request, res: Response) => {
    const config = await settingsService.getActiveTierConfig();
    res.json({ status: "success", data: { config } });
  }),

  /**
   * PATCH /api/subscriptions/admin/tier-config/:tier
   * Updates prices/limits for a tier in the DB and syncs prices to Paystack.
   * Accepts: priceMonthly, priceAnnual, maxProperties, maxVehicles, maxPhotos, commissionRate
   */
  adminUpdateTierConfig: catchAsync(async (req: Request, res: Response) => {
    const tier = req.params.tier as "pro" | "elite";
    if (!["pro", "elite"].includes(tier)) {
      throw new AppError("tier must be 'pro' or 'elite'", 400);
    }

    const allowed = ["priceMonthly", "priceAnnual", "maxProperties", "maxVehicles", "maxPhotos", "commissionRate"];
    const updates: Record<string, number> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const val = Number(req.body[key]);
        if (isNaN(val) || val < 0) throw new AppError(`${key} must be a non-negative number`, 400);
        updates[key] = val;
      }
    }
    if (Object.keys(updates).length === 0) {
      throw new AppError("No valid fields provided", 400);
    }

    if (updates.commissionRate !== undefined && (updates.commissionRate < 0 || updates.commissionRate > 1)) {
      throw new AppError("commissionRate must be between 0 and 1", 400);
    }

    const config = await settingsService.updateTierConfig(tier, updates);
    res.json({ status: "success", data: { config } });
  }),
};
