import { PlatformSettings } from "../entities/PlatformSettings";
import { User } from "../entities/User";
declare class SettingsService {
    private get repo();
    /** Returns the single platform settings row, creating it with defaults if missing. */
    getSettings(): Promise<PlatformSettings>;
    /**
     * Updates the global commission rate.
     * @param commissionRate  A value between 0 and 1 (e.g. 0.10 for 10%)
     */
    updateCommissionRate(commissionRate: number): Promise<PlatformSettings>;
    /**
     * Returns the effective commission rate for a given host.
     * Uses the host's override if set, otherwise falls back to the global rate.
     * @deprecated Prefer getEffectiveRateForHost() which respects subscription tiers.
     */
    getEffectiveRate(hostCommissionRateOverride: number | null): Promise<number>;
    /**
     * Returns the effective commission rate for a host, checking in priority order:
     * 1. Admin-set per-host override (commissionRateOverride)
     * 2. Subscription tier rate (from TIER_CONFIG)
     * 3. Global platform rate (PlatformSettings)
     */
    getEffectiveRateForHost(host: User): Promise<number>;
}
export declare const settingsService: SettingsService;
export {};
//# sourceMappingURL=settingsService.d.ts.map