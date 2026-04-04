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
    expireSubscription(subscriptionCode: string): Promise<void>;
    checkListingLimit(hostId: string, type: "property" | "vehicle"): Promise<void>;
}
export declare const subscriptionService: SubscriptionService;
export {};
//# sourceMappingURL=subscriptionService.d.ts.map