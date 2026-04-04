"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionController = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const subscriptionService_1 = require("../services/subscriptionService");
const AppError_1 = require("../utils/AppError");
const subscriptionTiers_1 = require("../constants/subscriptionTiers");
exports.subscriptionController = {
    /** GET /api/subscriptions/me — returns the host's current subscription + tier config */
    getMySubscription: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const subscription = await subscriptionService_1.subscriptionService.getSubscriptionForHost(req.user.id);
        res.json({
            status: "success",
            data: {
                subscription,
                currentTier: req.user.subscriptionTier ?? "starter",
                tierConfig: subscriptionTiers_1.TIER_CONFIG,
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
    /** DELETE /api/subscriptions/cancel — cancels the active subscription */
    cancelSubscription: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await subscriptionService_1.subscriptionService.cancelSubscription(req.user.id);
        res.json({ status: "success", data: null });
    }),
    /** GET /api/subscriptions/tiers — public, returns tier config for UI */
    getTierConfig: (0, catchAsync_1.catchAsync)(async (_req, res) => {
        res.json({ status: "success", data: { tiers: subscriptionTiers_1.TIER_CONFIG } });
    }),
};
//# sourceMappingURL=subscriptionController.js.map