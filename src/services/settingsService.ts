// src/services/settingsService.ts
import { AppDataSource } from "../config/database";
import { PlatformSettings } from "../entities/PlatformSettings";
import { AppError } from "../utils/AppError";
import { User } from "../entities/User";
import { TIER_CONFIG } from "../constants/subscriptionTiers";

const SINGLETON_ID = 1;

class SettingsService {
  private get repo() {
    return AppDataSource.getRepository(PlatformSettings);
  }

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
   * Updates the global commission rate.
   * @param commissionRate  A value between 0 and 1 (e.g. 0.10 for 10%)
   */
  async updateCommissionRate(commissionRate: number): Promise<PlatformSettings> {
    if (commissionRate < 0 || commissionRate > 1) {
      throw new AppError("Commission rate must be between 0 and 1", 400);
    }
    const settings = await this.getSettings();
    settings.commissionRate = commissionRate;
    return this.repo.save(settings);
  }

  /**
   * Returns the effective commission rate for a given host.
   * Uses the host's override if set, otherwise falls back to the global rate.
   * @deprecated Prefer getEffectiveRateForHost() which respects subscription tiers.
   */
  async getEffectiveRate(hostCommissionRateOverride: number | null): Promise<number> {
    if (hostCommissionRateOverride !== null && hostCommissionRateOverride !== undefined) {
      return Number(hostCommissionRateOverride);
    }
    const settings = await this.getSettings();
    return Number(settings.commissionRate);
  }

  /**
   * Returns the effective commission rate for a host, checking in priority order:
   * 1. Admin-set per-host override (commissionRateOverride)
   * 2. Subscription tier rate (from TIER_CONFIG)
   * 3. Global platform rate (PlatformSettings)
   */
  async getEffectiveRateForHost(host: User): Promise<number> {
    if (host.commissionRateOverride !== null && host.commissionRateOverride !== undefined) {
      return Number(host.commissionRateOverride);
    }
    const tier = host.subscriptionTier ?? "starter";
    return TIER_CONFIG[tier].commissionRate;
  }
}

export const settingsService = new SettingsService();
