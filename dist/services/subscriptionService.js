"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = void 0;
// src/services/subscriptionService.ts
const https = __importStar(require("https"));
const database_1 = require("../config/database");
const Subscription_1 = require("../entities/Subscription");
const User_1 = require("../entities/User");
const AppError_1 = require("../utils/AppError");
const subscriptionTiers_1 = require("../constants/subscriptionTiers");
const emailService_1 = require("./emailService");
const notificationService_1 = require("./notificationService");
function paystackRequest(method, path, body) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : undefined;
        const options = {
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
                try {
                    resolve(JSON.parse(data));
                }
                catch {
                    reject(new Error("Invalid JSON from Paystack"));
                }
            });
        });
        req.on("error", reject);
        if (payload)
            req.write(payload);
        req.end();
    });
}
class SubscriptionService {
    get subRepo() { return database_1.AppDataSource.getRepository(Subscription_1.Subscription); }
    get userRepo() { return database_1.AppDataSource.getRepository(User_1.User); }
    // ── Read ──────────────────────────────────────────────────────────────────
    async getActiveSubscription(hostId) {
        return this.subRepo.findOne({
            where: { hostId, status: "active" },
            order: { createdAt: "DESC" },
        });
    }
    async getSubscriptionForHost(hostId) {
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
    async initiateSubscription(host, tier, cycle) {
        if (tier === "starter") {
            throw new AppError_1.AppError("Starter is the free tier — no payment needed", 400);
        }
        const planCode = (0, subscriptionTiers_1.getPlanCode)(tier, cycle);
        if (!planCode) {
            throw new AppError_1.AppError(`Paystack plan not configured for ${tier}/${cycle}. ` +
                `Set ${tier.toUpperCase()}_${cycle.toUpperCase()}_PLAN_CODE in env.`, 500);
        }
        const frontendBase = (process.env.APP_URL || (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim());
        const callbackUrl = `${frontendBase}/dashboard/host/subscription?success=1&tier=${tier}&cycle=${cycle}`;
        const response = await paystackRequest("POST", "/transaction/initialize", {
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
        });
        if (!response.status) {
            throw new AppError_1.AppError(`Payment init failed: ${response.message}`, 502);
        }
        return {
            authorization_url: response.data.authorization_url,
            reference: response.data.reference,
        };
    }
    // ── Activate (called from webhook after first charge) ─────────────────────
    async activateSubscription(payload) {
        const { hostId, tier, cycle, planCode, subscriptionData } = payload;
        const host = await this.userRepo.findOne({ where: { id: hostId } });
        if (!host)
            return;
        // Cancel any existing active subscriptions
        await this.subRepo.update({ hostId, status: "active" }, { status: "cancelled", cancelledAt: new Date(), cancellationReason: "Upgraded/replaced" });
        // Calculate period
        const now = new Date();
        const periodEnd = new Date(subscriptionData.next_payment_date || now);
        if (isNaN(periodEnd.getTime())) {
            // Fallback: 1 month or 1 year from now
            periodEnd.setTime(now.getTime());
            if (cycle === "annual")
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            else
                periodEnd.setMonth(periodEnd.getMonth() + 1);
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
        emailService_1.emailService.sendSubscriptionConfirmation({
            to: host.email,
            firstName: host.firstName,
            tier: subscriptionTiers_1.TIER_CONFIG[tier].label,
            cycle,
            renewalDate: periodEnd.toLocaleDateString("en-GB"),
        }).catch(console.error);
        notificationService_1.notificationService.send({
            userId: hostId,
            type: "subscription_activated",
            title: `${subscriptionTiers_1.TIER_CONFIG[tier].label} plan activated 🎉`,
            body: `You're now on the ${subscriptionTiers_1.TIER_CONFIG[tier].label} plan. Enjoy reduced commission and more features.`,
            data: { url: "/dashboard/host/subscription", urlLabel: "Manage subscription" },
        }).catch(console.error);
    }
    // ── Renew (called from webhook on recurring charge) ────────────────────────
    async renewSubscription(subscriptionCode, nextPaymentDate) {
        const sub = await this.subRepo.findOne({
            where: { paystackSubscriptionCode: subscriptionCode },
            relations: ["host"],
        });
        if (!sub)
            return;
        const newEnd = new Date(nextPaymentDate);
        if (!isNaN(newEnd.getTime())) {
            sub.currentPeriodEnd = newEnd;
            sub.currentPeriodStart = new Date();
            sub.status = "active";
            await this.subRepo.save(sub);
        }
    }
    // ── Payment failure ────────────────────────────────────────────────────────
    async markPastDue(subscriptionCode) {
        const sub = await this.subRepo.findOne({
            where: { paystackSubscriptionCode: subscriptionCode },
            relations: ["host"],
        });
        if (!sub || !sub.host)
            return;
        sub.status = "past_due";
        await this.subRepo.save(sub);
        notificationService_1.notificationService.send({
            userId: sub.hostId,
            type: "subscription_payment_failed",
            title: "Subscription payment failed",
            body: "We couldn't process your subscription renewal. Please update your payment method to avoid downgrade.",
            data: { url: "/dashboard/host/subscription", urlLabel: "Update payment" },
        }).catch(console.error);
        emailService_1.emailService.sendSubscriptionPaymentFailed({
            to: sub.host.email,
            firstName: sub.host.firstName,
            tier: subscriptionTiers_1.TIER_CONFIG[sub.tier].label,
        }).catch(console.error);
    }
    // ── Cancel (host-initiated) ────────────────────────────────────────────────
    async cancelSubscription(hostId) {
        const sub = await this.subRepo.findOne({
            where: { hostId, status: "active" },
            relations: ["host"],
        });
        if (!sub)
            throw new AppError_1.AppError("No active subscription found", 404);
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
            notificationService_1.notificationService.send({
                userId: hostId,
                type: "subscription_cancelled",
                title: "Subscription cancelled",
                body: `Your ${subscriptionTiers_1.TIER_CONFIG[sub.tier].label} plan will remain active until ${sub.currentPeriodEnd.toLocaleDateString("en-GB")}, then downgrade to Starter.`,
                data: { url: "/dashboard/host/subscription", urlLabel: "View details" },
            }).catch(console.error);
            emailService_1.emailService.sendSubscriptionCancelled({
                to: sub.host.email,
                firstName: sub.host.firstName,
                tier: subscriptionTiers_1.TIER_CONFIG[sub.tier].label,
                accessUntil: sub.currentPeriodEnd.toLocaleDateString("en-GB"),
            }).catch(console.error);
        }
    }
    // ── Expire (called by disable webhook or cron) ────────────────────────────
    async expireSubscription(subscriptionCode) {
        const sub = await this.subRepo.findOne({
            where: { paystackSubscriptionCode: subscriptionCode },
        });
        if (!sub)
            return;
        sub.status = "expired";
        await this.subRepo.save(sub);
        // Downgrade to starter
        await this.userRepo.update(sub.hostId, { subscriptionTier: "starter" });
    }
    // ── Check limits ──────────────────────────────────────────────────────────
    async checkListingLimit(hostId, type) {
        const host = await this.userRepo.findOne({ where: { id: hostId } });
        if (!host)
            throw new AppError_1.AppError("Host not found", 404);
        const config = subscriptionTiers_1.TIER_CONFIG[host.subscriptionTier];
        const limit = type === "property" ? config.maxProperties : config.maxVehicles;
        if (limit === Infinity)
            return;
        let count;
        if (type === "property") {
            count = await database_1.AppDataSource.query(`SELECT COUNT(*) FROM properties WHERE "hostId" = $1 AND status != 'rejected'`, [hostId]);
        }
        else {
            count = await database_1.AppDataSource.query(`SELECT COUNT(*) FROM vehicles WHERE "hostId" = $1`, [hostId]);
        }
        if (Number(count[0].count) >= limit) {
            throw new AppError_1.AppError(`Your ${subscriptionTiers_1.TIER_CONFIG[host.subscriptionTier].label} plan allows up to ${limit} active ${type} listing${limit === 1 ? "" : "s"}. ` +
                `Upgrade your plan to add more.`, 403);
        }
    }
}
exports.subscriptionService = new SubscriptionService();
//# sourceMappingURL=subscriptionService.js.map