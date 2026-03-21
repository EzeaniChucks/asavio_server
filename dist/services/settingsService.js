"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsService = void 0;
// src/services/settingsService.ts
const database_1 = require("../config/database");
const PlatformSettings_1 = require("../entities/PlatformSettings");
const AppError_1 = require("../utils/AppError");
const SINGLETON_ID = 1;
class SettingsService {
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
     * Updates the global commission rate.
     * @param commissionRate  A value between 0 and 1 (e.g. 0.10 for 10%)
     */
    async updateCommissionRate(commissionRate) {
        if (commissionRate < 0 || commissionRate > 1) {
            throw new AppError_1.AppError("Commission rate must be between 0 and 1", 400);
        }
        const settings = await this.getSettings();
        settings.commissionRate = commissionRate;
        return this.repo.save(settings);
    }
    /**
     * Returns the effective commission rate for a given host.
     * Uses the host's override if set, otherwise falls back to the global rate.
     */
    async getEffectiveRate(hostCommissionRateOverride) {
        if (hostCommissionRateOverride !== null && hostCommissionRateOverride !== undefined) {
            return Number(hostCommissionRateOverride);
        }
        const settings = await this.getSettings();
        return Number(settings.commissionRate);
    }
}
exports.settingsService = new SettingsService();
//# sourceMappingURL=settingsService.js.map