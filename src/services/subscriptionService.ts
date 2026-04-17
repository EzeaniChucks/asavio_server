// src/services/subscriptionService.ts
import * as https from "https";
import { AppDataSource } from "../config/database";
import { In } from "typeorm";
import { Subscription } from "../entities/Subscription";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import {
  SubscriptionTier,
  BillingCycle,
  TIER_CONFIG,
  getPlanCode,
} from "../constants/subscriptionTiers";
import { settingsService } from "./settingsService";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: { authorization_url: string; reference: string };
}

interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    metadata?: Record<string, unknown>;
    subscription?: {
      subscription_code: string;
      email_token: string;
      next_payment_date: string;
    };
    customer?: { customer_code: string };
  };
}

interface PaystackSubscriptionData {
  subscription_code: string;
  email_token: string;
  customer: { customer_code: string };
  plan: { plan_code: string };
  next_payment_date: string;
  createdAt: string;
}

function paystackRequest<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options: https.RequestOptions = {
      hostname: "api.paystack.co",
      path,
      method,
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve(JSON.parse(data) as T); } catch { reject(new Error("Invalid JSON from Paystack")); }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

class SubscriptionService {
  private get subRepo() { return AppDataSource.getRepository(Subscription); }
  private get userRepo() { return AppDataSource.getRepository(User); }

  // ── Read ──────────────────────────────────────────────────────────────────

  async getActiveSubscription(hostId: string): Promise<Subscription | null> {
    return this.subRepo.findOne({
      where: { hostId, status: "active" },
      order: { createdAt: "DESC" },
    });
  }

  async getSubscriptionForHost(hostId: string): Promise<Subscription | null> {
    return this.subRepo.findOne({
      where: { hostId },
      order: { createdAt: "DESC" },
    });
  }

  // ── Initiate (redirect to Paystack) ───────────────────────────────────────

  /**
   * Initialises a Paystack transaction linked to a subscription plan.
   * On success the frontend redirects to the authorization_url; Paystack
   * creates the subscription automatically after the first charge.
   */
  async initiateSubscription(
    host: User,
    tier: SubscriptionTier,
    cycle: BillingCycle
  ): Promise<{ authorization_url: string; reference: string }> {
    if (tier === "starter") {
      throw new AppError("Starter is the free tier — no payment needed", 400);
    }

    const planCode = getPlanCode(tier, cycle);
    if (!planCode) {
      throw new AppError(
        `Paystack plan not configured for ${tier}/${cycle}. ` +
          `Set ${tier.toUpperCase()}_${cycle.toUpperCase()}_PLAN_CODE in env.`,
        500
      );
    }

    const frontendBase = (process.env.APP_URL || (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim());
    const callbackUrl = `${frontendBase}/dashboard/host/subscription?success=1&tier=${tier}&cycle=${cycle}`;

    const response = await paystackRequest<PaystackInitResponse>(
      "POST",
      "/transaction/initialize",
      {
        email: host.email,
        // Amount is 0 — Paystack uses the plan's amount
        amount: 0,
        plan: planCode,
        currency: "NGN",
        reference: `SUB-${host.id}-${tier}-${Date.now()}`,
        metadata: {
          hostId: host.id,
          subscriptionTier: tier,
          billingCycle: cycle,
          planCode,
          type: "subscription_initiate",
        },
        callback_url: callbackUrl,
      }
    );

    if (!response.status) {
      throw new AppError(`Payment init failed: ${response.message}`, 502);
    }

    return {
      authorization_url: response.data.authorization_url,
      reference: response.data.reference,
    };
  }

  // ── Verify + activate (callback fallback for when webhook hasn't fired) ─────

  /**
   * Called when Paystack redirects the host back after payment.
   * Verifies the transaction directly with Paystack and activates the subscription
   * if the webhook hasn't already done so (idempotent — safe to call multiple times).
   *
   * This is the fallback that makes subscriptions work in development (where
   * Paystack can't reach localhost to fire webhooks) and guards against webhook
   * delivery failures in production.
   */
  async verifyAndActivate(reference: string): Promise<{ tier: SubscriptionTier; alreadyActive: boolean }> {
    const response = await paystackRequest<PaystackVerifyResponse>(
      "GET",
      `/transaction/verify/${encodeURIComponent(reference)}`
    );

    if (!response.status) {
      throw new AppError("Could not reach Paystack to verify payment", 502);
    }
    if (response.data.status !== "success") {
      throw new AppError(`Payment not confirmed by Paystack (status: ${response.data.status})`, 402);
    }

    const meta = response.data.metadata as Record<string, unknown> | undefined;
    if (!meta || meta.type !== "subscription_initiate") {
      throw new AppError("Not a subscription payment reference", 400);
    }

    const hostId   = meta.hostId as string;
    const tier     = meta.subscriptionTier as SubscriptionTier;
    const cycle    = meta.billingCycle as BillingCycle;
    const planCode = meta.planCode as string;

    // Idempotency check — webhook may have already activated this subscription
    const existing = await this.subRepo.findOne({
      where: { hostId, status: "active", tier },
      order: { createdAt: "DESC" },
    });
    if (existing) {
      return { tier, alreadyActive: true };
    }

    // Merge subscription + customer fields from the verify response so that
    // paystackSubscriptionCode, paystackEmailToken, and paystackCustomerCode
    // are all stored correctly — same data that the webhook path stores.
    const subData = {
      ...(response.data.subscription ?? {}),
      customer: response.data.customer,
    } as PaystackSubscriptionData;
    await this.activateSubscription({ hostId, tier, cycle, planCode, subscriptionData: subData });
    return { tier, alreadyActive: false };
  }

  // ── Activate (called from webhook after first charge) ─────────────────────

  async activateSubscription(payload: {
    hostId: string;
    tier: SubscriptionTier;
    cycle: BillingCycle;
    planCode: string;
    subscriptionData: PaystackSubscriptionData;
  }): Promise<void> {
    const { hostId, tier, cycle, planCode, subscriptionData } = payload;

    const host = await this.userRepo.findOne({ where: { id: hostId } });
    if (!host) return;

    // Deduplication: if a record for this subscription_code already exists (active or
    // cancelled), reuse it rather than creating a second record. This prevents the
    // duplicate-code problem caused by the verify callback and the webhook racing.
    const subscriptionCode = subscriptionData.subscription_code;
    if (subscriptionCode) {
      const existingByCode = await this.subRepo.findOne({
        where: { paystackSubscriptionCode: subscriptionCode },
        order: { createdAt: "DESC" },
      });
      if (existingByCode) {
        // Already recorded — just ensure tier and status are up-to-date on the user.
        await this.userRepo.update(hostId, { subscriptionTier: tier });
        return;
      }
    }

    // Cancel any other active subscriptions for this host (upgrade/switch case)
    await this.subRepo.update(
      { hostId, status: "active" },
      { status: "cancelled", cancelledAt: new Date(), cancellationReason: "Upgraded/replaced" }
    );

    // Calculate period
    const now = new Date();
    const periodEnd = new Date(subscriptionData.next_payment_date || now);
    if (isNaN(periodEnd.getTime())) {
      // Fallback: 1 month or 1 year from now
      periodEnd.setTime(now.getTime());
      if (cycle === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      else periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const sub = this.subRepo.create({
      hostId,
      tier,
      billingCycle: cycle,
      status: "active",
      paystackSubscriptionCode: subscriptionCode,
      paystackCustomerCode: subscriptionData.customer?.customer_code,
      paystackPlanCode: planCode,
      paystackEmailToken: subscriptionData.email_token,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });
    await this.subRepo.save(sub);

    // Denormalise to User for fast middleware reads
    await this.userRepo.update(hostId, { subscriptionTier: tier });
    host.subscriptionTier = tier;

    // Notify (best-effort)
    emailService.sendSubscriptionConfirmation({
      to: host.email,
      firstName: host.firstName,
      tier: TIER_CONFIG[tier].label,
      cycle,
      renewalDate: periodEnd.toLocaleDateString("en-GB"),
    }).catch(console.error);

    notificationService.send({
      userId: hostId,
      type: "subscription_activated",
      title: `${TIER_CONFIG[tier].label} plan activated 🎉`,
      body: `You're now on the ${TIER_CONFIG[tier].label} plan. Enjoy reduced commission and more features.`,
      data: { url: "/dashboard/host/subscription", urlLabel: "Manage subscription" },
    }).catch(console.error);
  }

  // ── Renew (called from webhook on recurring charge) ────────────────────────

  async renewSubscription(subscriptionCode: string, nextPaymentDate: string): Promise<void> {
    const sub = await this.subRepo.findOne({
      where: { paystackSubscriptionCode: subscriptionCode },
      relations: ["host"],
      order: { createdAt: "DESC" },
    });
    if (!sub) return;

    const newEnd = new Date(nextPaymentDate);
    if (!isNaN(newEnd.getTime())) {
      sub.currentPeriodEnd = newEnd;
      sub.currentPeriodStart = new Date();
      sub.status = "active";
      await this.subRepo.save(sub);
    }
  }

  // ── Payment failure ────────────────────────────────────────────────────────

  async markPastDue(subscriptionCode: string): Promise<void> {
    const sub = await this.subRepo.findOne({
      where: { paystackSubscriptionCode: subscriptionCode },
      relations: ["host"],
      order: { createdAt: "DESC" },
    });
    if (!sub || !sub.host) return;

    sub.status = "past_due";
    await this.subRepo.save(sub);

    notificationService.send({
      userId: sub.hostId,
      type: "subscription_payment_failed",
      title: "Subscription payment failed",
      body: "We couldn't process your subscription renewal. Please update your payment method to avoid downgrade.",
      data: { url: "/dashboard/host/subscription", urlLabel: "Update payment" },
    }).catch(console.error);

    emailService.sendSubscriptionPaymentFailed({
      to: sub.host.email,
      firstName: sub.host.firstName,
      tier: TIER_CONFIG[sub.tier].label,
    }).catch(console.error);
  }

  // ── Cancel (host-initiated) ────────────────────────────────────────────────

  async cancelSubscription(hostId: string): Promise<void> {
    // Also allow cancelling past_due subscriptions — the host should always
    // be able to stop future charges even if the last payment failed.
    const sub = await this.subRepo.findOne({
      where: { hostId, status: In(["active", "past_due"]) },
      relations: ["host"],
      order: { createdAt: "DESC" },
    });
    if (!sub) throw new AppError("No active subscription to cancel", 404);

    // If Paystack codes are present, the disable call MUST succeed before we
    // touch our DB. Swallowing this error would mean the host thinks they
    // cancelled but Paystack keeps billing them on the next cycle.
    if (sub.paystackSubscriptionCode && sub.paystackEmailToken) {
      await paystackRequest("POST", "/subscription/disable", {
        code: sub.paystackSubscriptionCode,
        token: sub.paystackEmailToken,
      });
      // Throws on failure → catchAsync returns error to host; DB unchanged.
    } else {
      // No codes stored (e.g. activated via callback fallback in dev).
      // We can't notify Paystack — log it so it's visible in server logs.
      console.warn(
        `[Subscription] Cancelling sub ${sub.id} for host ${hostId} without Paystack disable — ` +
        `paystackSubscriptionCode or paystackEmailToken is missing. ` +
        `Paystack may continue billing until manually disabled on their dashboard.`
      );
    }

    sub.status = "cancelled";
    sub.cancelledAt = new Date();
    sub.cancellationReason = "Host-initiated cancellation";
    await this.subRepo.save(sub);

    // Downgrade at period end — keep current tier until then.
    // A cron job or the disable webhook will complete the downgrade.
    // We mark it so the UI shows "cancels on {date}".

    if (sub.host) {
      notificationService.send({
        userId: hostId,
        type: "subscription_cancelled",
        title: "Subscription cancelled",
        body: `Your ${TIER_CONFIG[sub.tier].label} plan will remain active until ${sub.currentPeriodEnd.toLocaleDateString("en-GB")}, then downgrade to Starter.`,
        data: { url: "/dashboard/host/subscription", urlLabel: "View details" },
      }).catch(console.error);

      emailService.sendSubscriptionCancelled({
        to: sub.host.email,
        firstName: sub.host.firstName,
        tier: TIER_CONFIG[sub.tier].label,
        accessUntil: sub.currentPeriodEnd.toLocaleDateString("en-GB"),
      }).catch(console.error);
    }
  }

  // ── Store subscription codes (from subscription.create webhook) ──────────

  /**
   * Called on `subscription.create` webhook. Paystack fires this alongside
   * the initial `charge.success`, and it's the authoritative source of
   * `subscription_code` and `email_token`. We upsert them onto the most
   * recently created subscription for this customer (matched by customer code
   * or, as a fallback, the newest active/pending subscription that lacks a code).
   */
  async storeSubscriptionCodes(
    subscriptionCode: string,
    emailToken: string | null,
    customerCode: string | null
  ): Promise<void> {
    // If we already have this subscription code stored, nothing to do
    const existing = await this.subRepo.findOne({
      where: { paystackSubscriptionCode: subscriptionCode },
      order: { createdAt: "DESC" },
    });
    if (existing) {
      // Ensure email_token is up-to-date
      if (emailToken && !existing.paystackEmailToken) {
        existing.paystackEmailToken = emailToken;
        await this.subRepo.save(existing);
      }
      return;
    }

    // Find the most recent active sub for this customer that doesn't have a code yet
    let sub: Subscription | null = null;
    if (customerCode) {
      sub = await this.subRepo
        .createQueryBuilder("s")
        .where("s.paystackCustomerCode = :code", { code: customerCode })
        .andWhere("s.paystackSubscriptionCode IS NULL")
        .orderBy("s.createdAt", "DESC")
        .getOne();
    }
    // Fallback: newest active sub without a code
    if (!sub) {
      sub = await this.subRepo
        .createQueryBuilder("s")
        .where("s.paystackSubscriptionCode IS NULL")
        .andWhere("s.status = :status", { status: "active" })
        .orderBy("s.createdAt", "DESC")
        .getOne();
    }

    if (sub) {
      sub.paystackSubscriptionCode = subscriptionCode;
      if (emailToken) sub.paystackEmailToken = emailToken;
      if (customerCode) sub.paystackCustomerCode = customerCode;
      await this.subRepo.save(sub);
    }
  }

  // ── Mark cancelled pending expiry (subscription.not_renew) ───────────────

  /**
   * Called on `subscription.not_renew`. The subscription is still active
   * (host keeps access) but won't renew. We mark as cancelled without
   * downgrading — `expireSubscription` handles the actual downgrade when
   * `subscription.disable` fires at end of billing period.
   */
  async markCancelledPendingExpiry(subscriptionCode: string): Promise<void> {
    const sub = await this.subRepo.findOne({
      where: { paystackSubscriptionCode: subscriptionCode },
      order: { createdAt: "DESC" },
    });
    if (!sub || sub.status === "cancelled" || sub.status === "expired") return;

    sub.status = "cancelled";
    sub.cancelledAt = sub.cancelledAt ?? new Date();
    sub.cancellationReason = sub.cancellationReason ?? "Non-renewal flagged by Paystack";
    await this.subRepo.save(sub);
  }

  // ── Expire (called by subscription.disable webhook) ───────────────────────

  async expireSubscription(subscriptionCode: string): Promise<void> {
    const sub = await this.subRepo.findOne({
      where: { paystackSubscriptionCode: subscriptionCode },
      order: { createdAt: "DESC" },
    });
    if (!sub) return;

    sub.status = "expired";
    await this.subRepo.save(sub);

    // Only downgrade to Starter if the host has no other active subscription.
    // Guard against the case where a host upgraded (e.g. Pro → Elite) and later
    // Paystack fires subscription.disable for the old Pro sub — without this
    // check that webhook would wipe out their active Elite tier.
    const activeNewer = await this.subRepo.findOne({
      where: { hostId: sub.hostId, status: "active" },
      order: { createdAt: "DESC" },
    });
    if (!activeNewer) {
      await this.userRepo.update(sub.hostId, { subscriptionTier: "starter" });
    }
  }

  // ── Admin: list all subscriptions ────────────────────────────────────────

  async adminListSubscriptions(opts: {
    page?: number;
    limit?: number;
    status?: string;
    tier?: string;
  }) {
    const { page = 1, status, tier } = opts;
    const limit = Math.min(opts.limit ?? 20, 100);

    const qb = this.subRepo
      .createQueryBuilder("s")
      .leftJoinAndSelect("s.host", "host")
      .orderBy("s.createdAt", "DESC");

    if (status) qb.andWhere("s.status = :status", { status });
    if (tier) qb.andWhere("s.tier = :tier", { tier });

    const total = await qb.getCount();
    const subs = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Strip passwords from host
    const subscriptions = subs.map((s) => ({
      ...s,
      host: s.host ? (({ password: _pw, ...h }) => h)(s.host as any) : null,
    }));

    return { subscriptions, total };
  }

  async adminGetStats() {
    const [total, byTier, byStatus, activeSubs, tierCfg] = await Promise.all([
      this.subRepo.count({ where: { status: "active" } }),
      this.subRepo
        .createQueryBuilder("s")
        .select("s.tier", "tier")
        .addSelect("COUNT(*)", "count")
        .where("s.status = :status", { status: "active" })
        .groupBy("s.tier")
        .getRawMany(),
      this.subRepo
        .createQueryBuilder("s")
        .select("s.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("s.status")
        .getRawMany(),
      // Get active subs with tier+billingCycle to compute MRR from live config prices
      this.subRepo
        .createQueryBuilder("s")
        .select("s.tier", "tier")
        .addSelect('s."billingCycle"', "billingCycle")
        .addSelect("COUNT(*)", "count")
        .where("s.status = :status", { status: "active" })
        .groupBy("s.tier")
        .addGroupBy('s."billingCycle"')
        .getRawMany(),
      settingsService.getActiveTierConfig(),
    ]);

    // Compute MRR from live DB prices (annual price / 12 for annual subscribers)
    const estimatedMRR = activeSubs.reduce((sum: number, row: any) => {
      const cfg = tierCfg[row.tier as SubscriptionTier];
      if (!cfg) return sum;
      const monthly = row.billingCycle === "annual"
        ? cfg.priceAnnual / 12
        : cfg.priceMonthly;
      return sum + monthly * Number(row.count);
    }, 0);

    return {
      activeSubscribers: total,
      byTier: Object.fromEntries(byTier.map((r: any) => [r.tier, Number(r.count)])),
      byStatus: Object.fromEntries(byStatus.map((r: any) => [r.status, Number(r.count)])),
      estimatedMRR: Math.round(estimatedMRR),
    };
  }

  async adminCancelSubscription(subscriptionId: string): Promise<void> {
    const sub = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: ["host"],
    });
    if (!sub) throw new AppError("Subscription not found", 404);
    if (sub.status !== "active") throw new AppError("Subscription is not active", 400);

    // Disable on Paystack
    if (sub.paystackSubscriptionCode && sub.paystackEmailToken) {
      await paystackRequest("POST", "/subscription/disable", {
        code: sub.paystackSubscriptionCode,
        token: sub.paystackEmailToken,
      }).catch(console.error);
    }

    // Immediately expire (admin override — no grace period)
    sub.status = "expired";
    sub.cancelledAt = new Date();
    sub.cancellationReason = "Admin-initiated cancellation";
    await this.subRepo.save(sub);

    await this.userRepo.update(sub.hostId, { subscriptionTier: "starter" });
  }

  // ── Check limits ──────────────────────────────────────────────────────────

  async checkListingLimit(hostId: string, type: "property" | "vehicle" | "hotel" | "event_center"): Promise<void> {
    const host = await this.userRepo.findOne({ where: { id: hostId } });
    if (!host) throw new AppError("Host not found", 404);

    // Safety net: if on a paid tier but subscription is cancelled and period has ended,
    // treat them as Starter even if the webhook hasn't fired yet.
    let effectiveTier = host.subscriptionTier ?? "starter";
    if (effectiveTier !== "starter") {
      const sub = await this.subRepo.findOne({
        where: { hostId },
        order: { createdAt: "DESC" },
      });
      if (
        sub &&
        (sub.status === "expired" ||
          (sub.status === "cancelled" && new Date(sub.currentPeriodEnd) < new Date()))
      ) {
        // Auto-expire the denormalized column so future checks are fast
        await this.userRepo.update(hostId, { subscriptionTier: "starter" });
        if (sub.status === "cancelled") {
          sub.status = "expired";
          await this.subRepo.save(sub);
        }
        effectiveTier = "starter";
      }
    }

    const tierConfig = await settingsService.getActiveTierConfig();
    const config = tierConfig[effectiveTier];
    const limit =
      type === "property" ? config.maxProperties
      : type === "vehicle" ? config.maxVehicles
      : type === "hotel" ? config.maxHotels
      : config.maxEventCenters;
    if (limit === Infinity) return;

    const query =
      type === "property"
        ? `SELECT COUNT(*) FROM properties WHERE "hostId" = $1 AND status != 'rejected'`
      : type === "vehicle"
        ? `SELECT COUNT(*) FROM vehicles WHERE "hostId" = $1`
      : type === "hotel"
        ? `SELECT COUNT(*) FROM hotels WHERE "hostId" = $1 AND status != 'rejected'`
        : `SELECT COUNT(*) FROM event_centers WHERE "hostId" = $1 AND status != 'rejected'`;
    const count: { count: string }[] = await AppDataSource.query(query, [hostId]);

    if (Number(count[0].count) >= limit) {
      throw new AppError(
        `Your ${config.label} plan allows up to ${limit} active ${type} listing${limit === 1 ? "" : "s"}. ` +
          `Upgrade your plan to add more.`,
        403
      );
    }
  }
}

export const subscriptionService = new SubscriptionService();
