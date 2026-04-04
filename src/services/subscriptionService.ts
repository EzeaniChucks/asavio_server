// src/services/subscriptionService.ts
import * as https from "https";
import { AppDataSource } from "../config/database";
import { Subscription } from "../entities/Subscription";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import {
  SubscriptionTier,
  BillingCycle,
  TIER_CONFIG,
  getPlanCode,
} from "../constants/subscriptionTiers";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";

interface PaystackCustomerResponse {
  status: boolean;
  data: { customer_code: string; email: string };
}

interface PaystackInitResponse {
  status: boolean;
  message: string;
  data: { authorization_url: string; reference: string };
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

    // Cancel any existing active subscriptions
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
      paystackSubscriptionCode: subscriptionData.subscription_code,
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

    // Notify
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
    const sub = await this.subRepo.findOne({
      where: { hostId, status: "active" },
      relations: ["host"],
    });
    if (!sub) throw new AppError("No active subscription found", 404);

    // Tell Paystack to disable the subscription
    if (sub.paystackSubscriptionCode && sub.paystackEmailToken) {
      await paystackRequest("POST", "/subscription/disable", {
        code: sub.paystackSubscriptionCode,
        token: sub.paystackEmailToken,
      }).catch(console.error); // best-effort
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

  // ── Expire (called by disable webhook or cron) ────────────────────────────

  async expireSubscription(subscriptionCode: string): Promise<void> {
    const sub = await this.subRepo.findOne({
      where: { paystackSubscriptionCode: subscriptionCode },
    });
    if (!sub) return;

    sub.status = "expired";
    await this.subRepo.save(sub);

    // Downgrade to starter
    await this.userRepo.update(sub.hostId, { subscriptionTier: "starter" });
  }

  // ── Check limits ──────────────────────────────────────────────────────────

  async checkListingLimit(hostId: string, type: "property" | "vehicle"): Promise<void> {
    const host = await this.userRepo.findOne({ where: { id: hostId } });
    if (!host) throw new AppError("Host not found", 404);

    const config = TIER_CONFIG[host.subscriptionTier];
    const limit = type === "property" ? config.maxProperties : config.maxVehicles;
    if (limit === Infinity) return;

    let count: { count: string }[];
    if (type === "property") {
      count = await AppDataSource.query(
        `SELECT COUNT(*) FROM properties WHERE "hostId" = $1 AND status != 'rejected'`,
        [hostId]
      );
    } else {
      count = await AppDataSource.query(
        `SELECT COUNT(*) FROM vehicles WHERE "hostId" = $1`,
        [hostId]
      );
    }

    if (Number(count[0].count) >= limit) {
      throw new AppError(
        `Your ${TIER_CONFIG[host.subscriptionTier].label} plan allows up to ${limit} active ${type} listing${limit === 1 ? "" : "s"}. ` +
          `Upgrade your plan to add more.`,
        403
      );
    }
  }
}

export const subscriptionService = new SubscriptionService();
