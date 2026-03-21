// src/services/hostTierService.ts
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Review } from "../entities/Review";
import { Conversation } from "../entities/Conversation";

const userRepo = () => AppDataSource.getRepository(User);
const reviewRepo = () => AppDataSource.getRepository(Review);
const convRepo = () => AppDataSource.getRepository(Conversation);

export const hostTierService = {
  /** Recompute and persist hostTier + responseRate for a given host. */
  async recompute(hostId: string): Promise<void> {
    const user = await userRepo().findOne({ where: { id: hostId } });
    if (!user) return;

    // ── Response rate ──────────────────────────────────────────────────────────
    const totalConvs = await convRepo()
      .createQueryBuilder("conv")
      .where("conv.hostId = :hostId", { hostId })
      .andWhere("conv.guestFirstMessageAt IS NOT NULL")
      .getCount();

    const repliedWithin24h = await convRepo()
      .createQueryBuilder("conv")
      .where("conv.hostId = :hostId", { hostId })
      .andWhere("conv.guestFirstMessageAt IS NOT NULL")
      .andWhere("conv.hostFirstReplyAt IS NOT NULL")
      .andWhere(
        "conv.hostFirstReplyAt <= conv.guestFirstMessageAt + INTERVAL '24 hours'"
      )
      .getCount();

    const responseRate = totalConvs > 0 ? repliedWithin24h / totalConvs : 0;

    // ── Review stats ───────────────────────────────────────────────────────────
    const reviews = await reviewRepo()
      .createQueryBuilder("review")
      .innerJoin("review.property", "property")
      .where("property.hostId = :hostId", { hostId })
      .getMany();

    const reviewCount = reviews.length;
    const avgRating =
      reviewCount > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;

    // ── Tier thresholds ────────────────────────────────────────────────────────
    let hostTier: "new_host" | "trusted_host" | "top_host" = "new_host";
    const kycApproved = user.kycStatus === "approved";

    if (kycApproved && reviewCount >= 20 && avgRating >= 4.7 && responseRate >= 0.8) {
      hostTier = "top_host";
    } else if (kycApproved && reviewCount >= 5 && avgRating >= 4.0 && responseRate >= 0.6) {
      hostTier = "trusted_host";
    }

    await userRepo().update(hostId, { hostTier, responseRate });
  },
};
