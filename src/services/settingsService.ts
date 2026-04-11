// src/services/settingsService.ts
import * as https from "https";
import { AppDataSource } from "../config/database";
import { PlatformSettings } from "../entities/PlatformSettings";
import { AppError } from "../utils/AppError";
import { User } from "../entities/User";
import {
  TIER_CONFIG,
  TierConfig,
  SubscriptionTier,
  getPlanCode,
} from "../constants/subscriptionTiers";

const SINGLETON_ID = 1;

/** Fields admin is allowed to override per tier */
export type TierConfigUpdates = Partial<Pick<
  TierConfig,
  "priceMonthly" | "priceAnnual" | "maxProperties" | "maxVehicles" | "maxPhotos" | "commissionRate"
>>;

class SettingsService {
  private get repo() {
    return AppDataSource.getRepository(PlatformSettings);
  }

  // ── In-memory tier config cache (60s TTL) ────────────────────────────────

  private _tierConfigCache: Record<SubscriptionTier, TierConfig> | null = null;
  private _tierConfigCachedAt = 0;
  private static readonly TIER_CACHE_TTL = 60_000;

  /** Returns the single platform settings row, creating it with defaults if missing. */
  async getSettings(): Promise<PlatformSettings> {
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
  async getActiveTierConfig(): Promise<Record<SubscriptionTier, TierConfig>> {
    const now = Date.now();
    if (
      this._tierConfigCache &&
      now - this._tierConfigCachedAt < SettingsService.TIER_CACHE_TTL
    ) {
      return this._tierConfigCache;
    }

    const settings = await this.getSettings();
    const overrides = (settings.subscriptionPlans ?? {}) as Partial<
      Record<SubscriptionTier, Partial<TierConfig>>
    >;

    // Deep-merge DB overrides onto hardcoded defaults
    // Infinity doesn't survive JSON round-trips — treat null/undefined as Infinity for max fields
    const resolveMax = (override: any, def: number) =>
      override === null || override === undefined ? def : Number(override);

    const merged: Record<SubscriptionTier, TierConfig> = {
      starter: {
        ...TIER_CONFIG.starter,
        ...(overrides.starter ?? {}),
      },
      pro: {
        ...TIER_CONFIG.pro,
        ...(overrides.pro ?? {}),
        maxProperties: resolveMax(overrides.pro?.maxProperties, TIER_CONFIG.pro.maxProperties),
        maxVehicles:   resolveMax(overrides.pro?.maxVehicles,   TIER_CONFIG.pro.maxVehicles),
      },
      elite: {
        ...TIER_CONFIG.elite,
        ...(overrides.elite ?? {}),
        // Elite defaults to Infinity — keep as Infinity unless explicitly overridden to a number
        maxProperties: resolveMax(overrides.elite?.maxProperties, TIER_CONFIG.elite.maxProperties),
        maxVehicles:   resolveMax(overrides.elite?.maxVehicles,   TIER_CONFIG.elite.maxVehicles),
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
  async updateTierConfig(
    tier: "pro" | "elite",
    updates: TierConfigUpdates
  ): Promise<Record<SubscriptionTier, TierConfig>> {
    // ── Step 1: sync prices to Paystack before touching the DB ───────────────
    const priceChanges: Array<{ cycle: "monthly" | "annual"; price: number }> = [];
    if (updates.priceMonthly !== undefined) priceChanges.push({ cycle: "monthly", price: updates.priceMonthly });
    if (updates.priceAnnual  !== undefined) priceChanges.push({ cycle: "annual",  price: updates.priceAnnual  });

    for (const { cycle, price } of priceChanges) {
      const planCode = getPlanCode(tier, cycle);
      if (!planCode) {
        throw new AppError(
          `No Paystack plan code is configured for ${tier}/${cycle}. ` +
          `Set ${tier.toUpperCase()}_${cycle.toUpperCase()}_PLAN_CODE in the server environment before changing prices.`,
          422
        );
      }
      // Throws on any Paystack error — DB is not touched yet
      await this.syncPlanPriceToPaystack(planCode, price);
    }

    // ── Step 2: Paystack confirmed (or no price change) — persist to DB ──────
    const settings = await this.getSettings();
    const overrides = (settings.subscriptionPlans ?? {}) as Record<string, any>;
    overrides[tier] = { ...(overrides[tier] ?? {}), ...updates };
    settings.subscriptionPlans = overrides;
    await this.repo.save(settings);

    this._tierConfigCache = null;
    return this.getActiveTierConfig();
  }

  /** Sends a Paystack plan price update. Amount must be in NGN; converted to kobo internally. */
  private syncPlanPriceToPaystack(planCode: string, priceNGN: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({ amount: Math.round(priceNGN * 100) });
      const options: https.RequestOptions = {
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
            if (!json.status) reject(new Error(`Paystack: ${json.message}`));
            else resolve();
          } catch {
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

  async updateCommissionRate(commissionRate: number): Promise<PlatformSettings> {
    if (commissionRate < 0 || commissionRate > 1) {
      throw new AppError("Commission rate must be between 0 and 1", 400);
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
  async getEffectiveRateForHost(host: User): Promise<number> {
    if (host.commissionRateOverride !== null && host.commissionRateOverride !== undefined) {
      return Number(host.commissionRateOverride);
    }
    const tier = host.subscriptionTier ?? "starter";
    const config = await this.getActiveTierConfig();
    return config[tier].commissionRate;
  }

  /** @deprecated Use getEffectiveRateForHost which respects subscription tiers. */
  async getEffectiveRate(hostCommissionRateOverride: number | null): Promise<number> {
    if (hostCommissionRateOverride !== null && hostCommissionRateOverride !== undefined) {
      return Number(hostCommissionRateOverride);
    }
    const settings = await this.getSettings();
    return Number(settings.commissionRate);
  }
}

export const settingsService = new SettingsService();
