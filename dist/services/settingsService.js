"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
// src/services/settingsService.ts
const https = __importStar(require("https"));
const database_1 = require("../config/database");
const PlatformSettings_1 = require("../entities/PlatformSettings");
const AppError_1 = require("../utils/AppError");
const subscriptionTiers_1 = require("../constants/subscriptionTiers");
const SINGLETON_ID = 1;
class SettingsService {
    constructor() {
        // ── In-memory tier config cache (60s TTL) ────────────────────────────────
        this._tierConfigCache = null;
        this._tierConfigCachedAt = 0;
    }
    get repo() {
        return database_1.AppDataSource.getRepository(PlatformSettings_1.PlatformSettings);
    }
    /** Returns the single platform settings row, creating it with defaults if missing. */
    async getSettings() {
        let settings = await this.repo.findOne({ where: { id: SINGLETON_ID } });
        if (!settings) {
            settings = this.repo.create({ id: SINGLETON_ID, commissionRate: 0.1 });
            await this.repo.save(settings);
        }
        return settings;
    }
    /**
     * Returns the active tier config, merging any admin overrides from the DB
     * on top of the hardcoded TIER_CONFIG defaults. Cached for 60 seconds.
     */
    async getActiveTierConfig() {
        const now = Date.now();
        if (this._tierConfigCache &&
            now - this._tierConfigCachedAt < SettingsService.TIER_CACHE_TTL) {
            return this._tierConfigCache;
        }
        const settings = await this.getSettings();
        const overrides = (settings.subscriptionPlans ?? {});
        // Deep-merge DB overrides onto hardcoded defaults
        // Infinity doesn't survive JSON round-trips — treat null/undefined as Infinity for max fields
        const resolveMax = (override, def) => override === null || override === undefined ? def : Number(override);
        const merged = {
            starter: {
                ...subscriptionTiers_1.TIER_CONFIG.starter,
                ...(overrides.starter ?? {}),
            },
            pro: {
                ...subscriptionTiers_1.TIER_CONFIG.pro,
                ...(overrides.pro ?? {}),
                maxProperties: resolveMax(overrides.pro?.maxProperties, subscriptionTiers_1.TIER_CONFIG.pro.maxProperties),
                maxVehicles: resolveMax(overrides.pro?.maxVehicles, subscriptionTiers_1.TIER_CONFIG.pro.maxVehicles),
            },
            elite: {
                ...subscriptionTiers_1.TIER_CONFIG.elite,
                ...(overrides.elite ?? {}),
                // Elite defaults to Infinity — keep as Infinity unless explicitly overridden to a number
                maxProperties: resolveMax(overrides.elite?.maxProperties, subscriptionTiers_1.TIER_CONFIG.elite.maxProperties),
                maxVehicles: resolveMax(overrides.elite?.maxVehicles, subscriptionTiers_1.TIER_CONFIG.elite.maxVehicles),
            },
        };
        this._tierConfigCache = merged;
        this._tierConfigCachedAt = now;
        return merged;
    }
    /**
     * Updates tier config overrides in the DB.
     *
     * If prices are being changed, Paystack is synced FIRST. The DB is only
     * written after Paystack confirms. If Paystack rejects the update (wrong
     * plan code, wrong key, etc.) an error is thrown and nothing is persisted —
     * keeping the two sources of truth in sync at all times.
     *
     * Non-price fields (limits, commission rate) do not touch Paystack and are
     * saved to DB directly.
     *
     * Note: Paystack plan price changes only affect NEW subscriptions —
     * existing subscribers continue at their original plan amount.
     */
    async updateTierConfig(tier, updates) {
        // ── Step 1: sync prices to Paystack before touching the DB ───────────────
        const priceChanges = [];
        if (updates.priceMonthly !== undefined)
            priceChanges.push({ cycle: "monthly", price: updates.priceMonthly });
        if (updates.priceAnnual !== undefined)
            priceChanges.push({ cycle: "annual", price: updates.priceAnnual });
        for (const { cycle, price } of priceChanges) {
            const planCode = (0, subscriptionTiers_1.getPlanCode)(tier, cycle);
            if (!planCode) {
                throw new AppError_1.AppError(`No Paystack plan code is configured for ${tier}/${cycle}. ` +
                    `Set ${tier.toUpperCase()}_${cycle.toUpperCase()}_PLAN_CODE in the server environment before changing prices.`, 422);
            }
            // Throws on any Paystack error — DB is not touched yet
            await this.syncPlanPriceToPaystack(planCode, price);
        }
        // ── Step 2: Paystack confirmed (or no price change) — persist to DB ──────
        const settings = await this.getSettings();
        const overrides = (settings.subscriptionPlans ?? {});
        overrides[tier] = { ...(overrides[tier] ?? {}), ...updates };
        settings.subscriptionPlans = overrides;
        await this.repo.save(settings);
        this._tierConfigCache = null;
        return this.getActiveTierConfig();
    }
    /** Sends a Paystack plan price update. Amount must be in NGN; converted to kobo internally. */
    syncPlanPriceToPaystack(planCode, priceNGN) {
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify({ amount: Math.round(priceNGN * 100) });
            const options = {
                hostname: "api.paystack.co",
                path: `/plan/${planCode}`,
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(payload),
                },
            };
            const req = https.request(options, (res) => {
                let data = "";
                res.on("data", (chunk) => (data += chunk));
                res.on("end", () => {
                    try {
                        const json = JSON.parse(data);
                        if (!json.status)
                            reject(new Error(`Paystack: ${json.message}`));
                        else
                            resolve();
                    }
                    catch {
                        reject(new Error("Invalid JSON from Paystack"));
                    }
                });
            });
            req.on("error", reject);
            req.write(payload);
            req.end();
        });
    }
    // ── Commission rate ──────────────────────────────────────────────────────
    async updateCommissionRate(commissionRate) {
        if (commissionRate < 0 || commissionRate > 1) {
            throw new AppError_1.AppError("Commission rate must be between 0 and 1", 400);
        }
        const settings = await this.getSettings();
        settings.commissionRate = commissionRate;
        return this.repo.save(settings);
    }
    /**
     * Returns the effective commission rate for a host, checking in priority order:
     * 1. Admin-set per-host override
     * 2. Subscription tier rate (from DB config, falls back to hardcoded defaults)
     * 3. Global platform rate
     */
    async getEffectiveRateForHost(host) {
        if (host.commissionRateOverride !== null && host.commissionRateOverride !== undefined) {
            return Number(host.commissionRateOverride);
        }
        const tier = host.subscriptionTier ?? "starter";
        const config = await this.getActiveTierConfig();
        return config[tier].commissionRate;
    }
    /** @deprecated Use getEffectiveRateForHost which respects subscription tiers. */
    async getEffectiveRate(hostCommissionRateOverride) {
        if (hostCommissionRateOverride !== null && hostCommissionRateOverride !== undefined) {
            return Number(hostCommissionRateOverride);
        }
        const settings = await this.getSettings();
        return Number(settings.commissionRate);
    }
}
SettingsService.TIER_CACHE_TTL = 60000;
exports.settingsService = new SettingsService();
//# sourceMappingURL=settingsService.js.map