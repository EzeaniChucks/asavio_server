"use strict";
// src/constants/subscriptionTiers.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_ENV_KEYS = exports.TIER_ORDER = exports.TIER_CONFIG = void 0;
exports.tierMeetsMinimum = tierMeetsMinimum;
exports.getPlanCode = getPlanCode;
exports.TIER_CONFIG = {
    starter: {
        label: "Starter",
        maxProperties: 3,
        maxVehicles: 2,
        maxPhotos: 20,
        featureVideo: false,
        videoMaxSeconds: 0,
        videoMaxSizeMB: 0,
        commissionRate: 0.12,
        searchBoost: 0,
        homepageFeatured: false,
        priceMonthly: 0,
        priceAnnual: 0,
    },
    pro: {
        label: "Pro",
        maxProperties: 10,
        maxVehicles: 6,
        maxPhotos: 30,
        featureVideo: true,
        videoMaxSeconds: 60,
        videoMaxSizeMB: 50,
        commissionRate: 0.10,
        searchBoost: 5,
        homepageFeatured: false,
        priceMonthly: 7500,
        priceAnnual: 75000, // 2 months free
    },
    elite: {
        label: "Elite",
        maxProperties: Infinity,
        maxVehicles: Infinity,
        maxPhotos: 50,
        featureVideo: true,
        videoMaxSeconds: 90,
        videoMaxSizeMB: 100,
        commissionRate: 0.08,
        searchBoost: 15,
        homepageFeatured: true,
        priceMonthly: 18000,
        priceAnnual: 180000, // 2 months free
    },
};
/** Ordered from lowest to highest for comparison */
exports.TIER_ORDER = ["starter", "pro", "elite"];
/** Returns true if `candidate` meets or exceeds `required` */
function tierMeetsMinimum(candidate, required) {
    return exports.TIER_ORDER.indexOf(candidate) >= exports.TIER_ORDER.indexOf(required);
}
/** Paystack plan code env var names */
exports.PLAN_ENV_KEYS = {
    starter: { monthly: null, annual: null },
    pro: { monthly: "PAYSTACK_PRO_MONTHLY_PLAN_CODE", annual: "PAYSTACK_PRO_ANNUAL_PLAN_CODE" },
    elite: { monthly: "PAYSTACK_ELITE_MONTHLY_PLAN_CODE", annual: "PAYSTACK_ELITE_ANNUAL_PLAN_CODE" },
};
function getPlanCode(tier, cycle) {
    const key = exports.PLAN_ENV_KEYS[tier][cycle];
    if (!key)
        return null;
    return process.env[key] ?? null;
}
//# sourceMappingURL=subscriptionTiers.js.map