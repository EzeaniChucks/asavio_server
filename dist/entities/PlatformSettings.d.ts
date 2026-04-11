/**
 * Singleton table — always exactly one row with id = 1.
 * Use PlatformSettingsService to read/write it.
 */
export declare class PlatformSettings {
    id: number;
    /** Global platform commission rate (0–1). e.g. 0.10 = 10% */
    commissionRate: number;
    /**
     * Per-tier overrides for subscription plan config (prices, limits, commission).
     * Merged on top of the hardcoded TIER_CONFIG defaults at runtime.
     * Only "pro" and "elite" keys are expected; "starter" is always free.
     */
    subscriptionPlans: Record<string, any> | null;
    updatedAt: Date;
}
//# sourceMappingURL=PlatformSettings.d.ts.map