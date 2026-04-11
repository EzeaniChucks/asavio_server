import { PlatformSettings } from "../entities/PlatformSettings";
import { User } from "../entities/User";
import { TierConfig, SubscriptionTier } from "../constants/subscriptionTiers";
/** Fields admin is allowed to override per tier */
export type TierConfigUpdates = Partial<Pick<TierConfig, "priceMonthly" | "priceAnnual" | "maxProperties" | "maxVehicles" | "maxPhotos" | "commissionRate">>;
declare class SettingsService {
    private get repo();
    private _tierConfigCache;
    private _tierConfigCachedAt;
    private static readonly TIER_CACHE_TTL;
    /** Returns the single platform settings row, creating it with defaults if missing. */
    getSettings(): Promise<PlatformSettings>;
    /**
     * Returns the active tier config, merging any admin overrides from the DB
     * on top of the hardcoded TIER_CONFIG defaults. Cached for 60 seconds.
     */
    getActiveTierConfig(): Promise<Record<SubscriptionTier, TierConfig>>;
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
    updateTierConfig(tier: "pro" | "elite", updates: TierConfigUpdates): Promise<Record<SubscriptionTier, TierConfig>>;
    /** Sends a Paystack plan price update. Amount must be in NGN; converted to kobo internally. */
    private syncPlanPriceToPaystack;
    updateCommissionRate(commissionRate: number): Promise<PlatformSettings>;
    /**
     * Returns the effective commission rate for a host, checking in priority order:
     * 1. Admin-set per-host override
     * 2. Subscription tier rate (from DB config, falls back to hardcoded defaults)
     * 3. Global platform rate
     */
    getEffectiveRateForHost(host: User): Promise<number>;
    /** @deprecated Use getEffectiveRateForHost which respects subscription tiers. */
    getEffectiveRate(hostCommissionRateOverride: number | null): Promise<number>;
}
export declare const settingsService: SettingsService;
export {};
//# sourceMappingURL=settingsService.d.ts.map