export declare const CANCELLATION_POLICIES: {
    readonly flexible: {
        readonly name: "Flexible";
        readonly summary: "Full refund up to 24 h before check-in.";
        readonly description: string;
        readonly rules: readonly [{
            readonly daysBeforeCheckIn: 1;
            readonly refundOfHostPayout: 1;
        }, {
            readonly daysBeforeCheckIn: 0;
            readonly refundOfHostPayout: 0;
        }];
    };
    readonly moderate: {
        readonly name: "Moderate";
        readonly summary: "Full refund up to 5 days before check-in.";
        readonly description: string;
        readonly rules: readonly [{
            readonly daysBeforeCheckIn: 5;
            readonly refundOfHostPayout: 1;
        }, {
            readonly daysBeforeCheckIn: 0;
            readonly refundOfHostPayout: 0;
        }];
    };
    readonly firm: {
        readonly name: "Firm";
        readonly summary: "Full refund up to 14 days · 50% refund 7–14 days · No refund within 7 days.";
        readonly description: string;
        readonly rules: readonly [{
            readonly daysBeforeCheckIn: 14;
            readonly refundOfHostPayout: 1;
        }, {
            readonly daysBeforeCheckIn: 7;
            readonly refundOfHostPayout: 0.5;
        }, {
            readonly daysBeforeCheckIn: 0;
            readonly refundOfHostPayout: 0;
        }];
    };
    readonly strict: {
        readonly name: "Strict";
        readonly summary: "Full refund up to 30 days · 50% refund 14–30 days · No refund within 14 days.";
        readonly description: string;
        readonly rules: readonly [{
            readonly daysBeforeCheckIn: 30;
            readonly refundOfHostPayout: 1;
        }, {
            readonly daysBeforeCheckIn: 14;
            readonly refundOfHostPayout: 0.5;
        }, {
            readonly daysBeforeCheckIn: 0;
            readonly refundOfHostPayout: 0;
        }];
    };
};
export type CancellationPolicyType = keyof typeof CANCELLATION_POLICIES;
export declare const POLICY_TYPES: CancellationPolicyType[];
export interface RefundEstimate {
    /** Amount the guest will receive back, in NGN */
    refundAmount: number;
    /** Whether the grace period applies */
    inGracePeriod: boolean;
    /** Human-readable reason */
    reason: string;
    /** Policy that was applied */
    policy: CancellationPolicyType;
}
/**
 * Calculates the refund amount for a guest cancellation.
 *
 * @param totalPrice  - Amount the guest paid
 * @param hostPayout  - Amount due to the host (totalPrice minus platform commission)
 * @param checkIn     - Check-in date of the booking
 * @param createdAt   - When the booking was created (for grace period check)
 * @param policy      - The listing's cancellation policy
 * @param cancelledBy - "guest" | "host" | "admin"
 */
export declare function calculateRefund(opts: {
    totalPrice: number;
    hostPayout: number;
    checkIn: Date;
    createdAt: Date;
    policy: string;
    cancelledBy: "guest" | "host" | "admin";
}): RefundEstimate;
//# sourceMappingURL=cancellationPolicies.d.ts.map