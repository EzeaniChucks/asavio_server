import { User } from "./User";
import { SubscriptionTier, BillingCycle } from "../constants/subscriptionTiers";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export declare class Subscription {
    id: string;
    hostId: string;
    host: User;
    tier: SubscriptionTier;
    billingCycle: BillingCycle;
    status: SubscriptionStatus;
    /** Paystack subscription code — used to cancel/manage via Paystack API */
    paystackSubscriptionCode: string | null;
    /** Paystack customer code */
    paystackCustomerCode: string | null;
    /** Paystack plan code used for this subscription */
    paystackPlanCode: string | null;
    /** Paystack email token — used for the manage subscription link */
    paystackEmailToken: string | null;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelledAt: Date | null;
    cancellationReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Subscription.d.ts.map