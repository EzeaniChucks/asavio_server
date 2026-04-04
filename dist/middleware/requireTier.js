"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTier = requireTier;
const AppError_1 = require("../utils/AppError");
const subscriptionTiers_1 = require("../constants/subscriptionTiers");
/**
 * Middleware factory that gates a route behind a minimum subscription tier.
 *
 * Usage:
 *   router.post("/feature-video", protect, requireTier("pro"), uploadVideo, controller)
 */
function requireTier(minimumTier) {
    return (req, _res, next) => {
        const hostTier = req.user?.subscriptionTier ?? "starter";
        if (!(0, subscriptionTiers_1.tierMeetsMinimum)(hostTier, minimumTier)) {
            return next(new AppError_1.AppError(`This feature requires the ${subscriptionTiers_1.TIER_CONFIG[minimumTier].label} plan or higher. ` +
                `Your current plan is ${subscriptionTiers_1.TIER_CONFIG[hostTier].label}.`, 403));
        }
        next();
    };
}
//# sourceMappingURL=requireTier.js.map