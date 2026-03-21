import { PlatformSettings } from "../entities/PlatformSettings";
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
     */
    getEffectiveRate(hostCommissionRateOverride: number | null): Promise<number>;
}
export declare const settingsService: SettingsService;
export {};
//# sourceMappingURL=settingsService.d.ts.map