"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTier = requireTier;
const AppError_1 = require("../utils/AppError");
const subscriptionTiers_1 = require("../constants/subscriptionTiers");
const settingsService_1 = require("../services/settingsService");
const database_1 = require("../config/database");
const Subscription_1 = require("../entities/Subscription");
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
function requireTier(minimumTier) {
    return async (req, _res, next) => {
        const config = await settingsService_1.settingsService.getActiveTierConfig();
        let hostTier = req.user?.subscriptionTier ?? "starter";
        // Safety net: if on a paid tier, verify period hasn't silently expired
        if (hostTier !== "starter") {
            const sub = await database_1.AppDataSource.getRepository(Subscription_1.Subscription).findOne({
                where: { hostId: req.user.id },
                order: { createdAt: "DESC" },
            });
            if (sub &&
                (sub.status === "expired" ||
                    (sub.status === "cancelled" && new Date(sub.currentPeriodEnd) < new Date()))) {
                hostTier = "starter";
                // Lazily sync the denormalized column so subsequent checks are fast
                database_1.AppDataSource.getRepository("users")
                    .update(req.user.id, { subscriptionTier: "starter" })
                    .catch(console.error);
            }
        }
        if (!(0, subscriptionTiers_1.tierMeetsMinimum)(hostTier, minimumTier)) {
            return next(new AppError_1.AppError(`This feature requires the ${config[minimumTier].label} plan or higher. ` +
                `Your current plan is ${config[hostTier].label}.`, 403));
        }
        next();
    };
}
//# sourceMappingURL=requireTier.js.map