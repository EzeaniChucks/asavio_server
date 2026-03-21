/**
 * Singleton table — always exactly one row with id = 1.
 * Use PlatformSettingsService to read/write it.
 */
export declare class PlatformSettings {
    id: number;
    /** Global platform commission rate (0–1). e.g. 0.10 = 10% */
    commissionRate: number;
    updatedAt: Date;
}
//# sourceMappingURL=PlatformSettings.d.ts.map