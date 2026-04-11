"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const subscriptionService_1 = require("../services/subscriptionService");
const settingsService_1 = require("../services/settingsService");
const AppError_1 = require("../utils/AppError");
exports.subscriptionController = {
    /** GET /api/subscriptions/me — returns the host's current subscription + tier config */
    getMySubscription: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const [subscription, tierConfig] = await Promise.all([
            subscriptionService_1.subscriptionService.getSubscriptionForHost(req.user.id),
            settingsService_1.settingsService.getActiveTierConfig(),
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
    initiateSubscription: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { tier, billingCycle } = req.body;
        if (!tier || !["pro", "elite"].includes(tier)) {
            throw new AppError_1.AppError("tier must be 'pro' or 'elite'", 400);
        }
        if (!billingCycle || !["monthly", "annual"].includes(billingCycle)) {
            throw new AppError_1.AppError("billingCycle must be 'monthly' or 'annual'", 400);
        }
        const result = await subscriptionService_1.subscriptionService.initiateSubscription(req.user, tier, billingCycle);
        res.json({ status: "success", data: result });
    }),
    /**
     * POST /api/subscriptions/verify
     * Called by the frontend after Paystack's callback redirect.
     * Verifies the payment with Paystack and activates the subscription if the
     * webhook hasn't already done so. Safe to call multiple times (idempotent).
     */
    verifySubscription: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { reference } = req.body;
        if (!reference || typeof reference !== "string") {
            throw new AppError_1.AppError("reference is required", 400);
        }
        const { tier, alreadyActive } = await subscriptionService_1.subscriptionService.verifyAndActivate(reference);
        res.json({ status: "success", data: { tier, alreadyActive } });
    }),
    /** DELETE /api/subscriptions/cancel — cancels the active subscription */
    cancelSubscription: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await subscriptionService_1.subscriptionService.cancelSubscription(req.user.id);
        res.json({ status: "success", data: null });
    }),
    /** GET /api/subscriptions/tiers — public, returns tier config for UI */
    getTierConfig: (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const tiers = await settingsService_1.settingsService.getActiveTierConfig();
        res.json({ status: "success", data: { tiers } });
    }),
    // ── Admin ─────────────────────────────────────────────────────────────────
    /** GET /api/subscriptions/admin — paginated list of all subscriptions */
    adminListSubscriptions: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { page, limit, status, tier } = req.query;
        const result = await subscriptionService_1.subscriptionService.adminListSubscriptions({
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 20,
            status: status,
            tier: tier,
        });
        res.json({ status: "success", data: result });
    }),
    /** GET /api/subscriptions/admin/stats */
    adminGetStats: (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const stats = await subscriptionService_1.subscriptionService.adminGetStats();
        res.json({ status: "success", data: { stats } });
    }),
    /** DELETE /api/subscriptions/admin/:id — force-cancel any subscription */
    adminCancelSubscription: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await subscriptionService_1.subscriptionService.adminCancelSubscription(req.params.id);
        res.status(204).send();
    }),
    /** GET /api/subscriptions/admin/tier-config — current active tier config (DB + defaults) */
    adminGetTierConfig: (0, catchAsync_1.catchAsync)(async (_req, res) => {
        const config = await settingsService_1.settingsService.getActiveTierConfig();
        res.json({ status: "success", data: { config } });
    }),
    /**
     * PATCH /api/subscriptions/admin/tier-config/:tier
     * Updates prices/limits for a tier in the DB and syncs prices to Paystack.
     * Accepts: priceMonthly, priceAnnual, maxProperties, maxVehicles, maxPhotos, commissionRate
     */
    adminUpdateTierConfig: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const tier = req.params.tier;
        if (!["pro", "elite"].includes(tier)) {
            throw new AppError_1.AppError("tier must be 'pro' or 'elite'", 400);
        }
        const allowed = ["priceMonthly", "priceAnnual", "maxProperties", "maxVehicles", "maxPhotos", "commissionRate"];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) {
                const val = Number(req.body[key]);
                if (isNaN(val) || val < 0)
                    throw new AppError_1.AppError(`${key} must be a non-negative number`, 400);
                updates[key] = val;
            }
        }
        if (Object.keys(updates).length === 0) {
            throw new AppError_1.AppError("No valid fields provided", 400);
        }
        if (updates.commissionRate !== undefined && (updates.commissionRate < 0 || updates.commissionRate > 1)) {
            throw new AppError_1.AppError("commissionRate must be between 0 and 1", 400);
        }
        const config = await settingsService_1.settingsService.updateTierConfig(tier, updates);
        res.json({ status: "success", data: { config } });
    }),
};
//# sourceMappingURL=subscriptionController.js.map