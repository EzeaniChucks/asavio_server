import { Subscription } from "../entities/Subscription";
import { User } from "../entities/User";
import { SubscriptionTier, BillingCycle } from "../constants/subscriptionTiers";
interface PaystackSubscriptionData {
    subscription_code: string;
    email_token: string;
    customer: {
        customer_code: string;
    };
    plan: {
        plan_code: string;
    };
    next_payment_date: string;
    createdAt: string;
}
declare class SubscriptionService {
    private get subRepo();
    private get userRepo();
    getActiveSubscription(hostId: string): Promise<Subscription | null>;
    getSubscriptionForHost(hostId: string): Promise<Subscription | null>;
    /**
     * Initialises a Paystack transaction linked to a subscription plan.
     * On success the frontend redirects to the authorization_url; Paystack
     * creates the subscription automatically after the first charge.
     */
    initiateSubscription(host: User, tier: SubscriptionTier, cycle: BillingCycle): Promise<{
        authorization_url: string;
        reference: string;
    }>;
    /**
     * Called when Paystack redirects the host back after payment.
     * Verifies the transaction directly with Paystack and activates the subscription
     * if the webhook hasn't already done so (idempotent — safe to call multiple times).
     *
     * This is the fallback that makes subscriptions work in development (where
     * Paystack can't reach localhost to fire webhooks) and guards against webhook
     * delivery failures in production.
     */
    verifyAndActivate(reference: string): Promise<{
        tier: SubscriptionTier;
        alreadyActive: boolean;
    }>;
    activateSubscription(payload: {
        hostId: string;
        tier: SubscriptionTier;
        cycle: BillingCycle;
        planCode: string;
        subscriptionData: PaystackSubscriptionData;
    }): Promise<void>;
    renewSubscription(subscriptionCode: string, nextPaymentDate: string): Promise<void>;
    markPastDue(subscriptionCode: string): Promise<void>;
    cancelSubscription(hostId: string): Promise<void>;
    /**
     * Called on `subscription.create` webhook. Paystack fires this alongside
     * the initial `charge.success`, and it's the authoritative source of
     * `subscription_code` and `email_token`. We upsert them onto the most
     * recently created subscription for this customer (matched by customer code
     * or, as a fallback, the newest active/pending subscription that lacks a code).
     */
    storeSubscriptionCodes(subscriptionCode: string, emailToken: string | null, customerCode: string | null): Promise<void>;
    /**
     * Called on `subscription.not_renew`. The subscription is still active
     * (host keeps access) but won't renew. We mark as cancelled without
     * downgrading — `expireSubscription` handles the actual downgrade when
     * `subscription.disable` fires at end of billing period.
     */
    markCancelledPendingExpiry(subscriptionCode: string): Promise<void>;
    expireSubscription(subscriptionCode: string): Promise<void>;
    adminListSubscriptions(opts: {
        page?: number;
        limit?: number;
        status?: string;
        tier?: string;
    }): Promise<{
        subscriptions: {
            host: any;
            id: string;
            hostId: string;
            tier: SubscriptionTier;
            billingCycle: BillingCycle;
            status: import("../entities/Subscription").SubscriptionStatus;
            paystackSubscriptionCode: string | null;
            paystackCustomerCode: string | null;
            paystackPlanCode: string | null;
            paystackEmailToken: string | null;
            currentPeriodStart: Date;
            currentPeriodEnd: Date;
            cancelledAt: Date | null;
            cancellationReason: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    adminGetStats(): Promise<{
        activeSubscribers: number;
        byTier: any;
        byStatus: any;
        estimatedMRR: number;
    }>;
    adminCancelSubscription(subscriptionId: string): Promise<void>;
    checkListingLimit(hostId: string, type: "property" | "vehicle"): Promise<void>;
}
export declare const subscriptionService: SubscriptionService;
export {};
//# sourceMappingURL=subscriptionService.d.ts.map