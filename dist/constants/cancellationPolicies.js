"use strict";
// src/constants/cancellationPolicies.ts
//
// Cancellation policy definitions and refund calculation logic.
//
// Refund model
// ─────────────
// Within grace period (24 h from booking, only when check-in is 7+ days away):
//   guest receives 100 % of totalPrice back (full refund incl. platform commission)
//
// Outside grace period:
//   "full refund"    → guest receives hostPayout  (platform keeps its commission)
//   "50 % refund"    → guest receives hostPayout × 0.5
//   "no refund"      → guest receives 0
//
// Host or admin cancels:
//   guest always receives 100 % of totalPrice (platform waives its commission)
Object.defineProperty(exports, "__esModule", { value: true });
exports.POLICY_TYPES = exports.CANCELLATION_POLICIES = void 0;
exports.calculateRefund = calculateRefund;
exports.CANCELLATION_POLICIES = {
    flexible: {
        name: "Flexible",
        summary: "Full refund up to 24 h before check-in.",
        description: "Guests can cancel for a full refund (excluding platform fee) up to 24 hours before check-in. " +
            "Cancellations within 24 hours are non-refundable.",
        // rules are evaluated in order; first matching threshold wins
        rules: [
            { daysBeforeCheckIn: 1, refundOfHostPayout: 1.0 }, // > 24 h: full host payout back
            { daysBeforeCheckIn: 0, refundOfHostPayout: 0 }, // ≤ 24 h: no refund
        ],
    },
    moderate: {
        name: "Moderate",
        summary: "Full refund up to 5 days before check-in.",
        description: "Guests can cancel for a full refund (excluding platform fee) up to 5 days before check-in. " +
            "Cancellations within 5 days are non-refundable.",
        rules: [
            { daysBeforeCheckIn: 5, refundOfHostPayout: 1.0 },
            { daysBeforeCheckIn: 0, refundOfHostPayout: 0 },
        ],
    },
    firm: {
        name: "Firm",
        summary: "Full refund up to 14 days · 50% refund 7–14 days · No refund within 7 days.",
        description: "Full refund (excluding platform fee) if cancelled 14+ days before check-in. " +
            "50% refund for cancellations 7–14 days before check-in. " +
            "No refund within 7 days of check-in.",
        rules: [
            { daysBeforeCheckIn: 14, refundOfHostPayout: 1.0 },
            { daysBeforeCheckIn: 7, refundOfHostPayout: 0.5 },
            { daysBeforeCheckIn: 0, refundOfHostPayout: 0 },
        ],
    },
    strict: {
        name: "Strict",
        summary: "Full refund up to 30 days · 50% refund 14–30 days · No refund within 14 days.",
        description: "Full refund (excluding platform fee) if cancelled 30+ days before check-in. " +
            "50% refund for cancellations 14–30 days before check-in. " +
            "No refund within 14 days of check-in.",
        rules: [
            { daysBeforeCheckIn: 30, refundOfHostPayout: 1.0 },
            { daysBeforeCheckIn: 14, refundOfHostPayout: 0.5 },
            { daysBeforeCheckIn: 0, refundOfHostPayout: 0 },
        ],
    },
};
exports.POLICY_TYPES = Object.keys(exports.CANCELLATION_POLICIES);
/** Grace period: free cancellation within 24 h of booking if check-in is 7+ days away */
const GRACE_PERIOD_HOURS = 24;
const GRACE_MIN_DAYS_AHEAD = 7;
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
function calculateRefund(opts) {
    const { totalPrice, hostPayout, checkIn, createdAt, cancelledBy } = opts;
    const policy = opts.policy in exports.CANCELLATION_POLICIES
        ? opts.policy
        : "flexible";
    // Host or admin cancellation → full refund to protect the guest
    if (cancelledBy !== "guest") {
        return {
            refundAmount: Math.round(totalPrice * 100) / 100,
            inGracePeriod: false,
            reason: `${cancelledBy === "host" ? "Host" : "Admin"} cancelled — full refund issued.`,
            policy,
        };
    }
    const now = new Date();
    const msUntilCheckIn = checkIn.getTime() - now.getTime();
    const daysUntilCheckIn = msUntilCheckIn / (1000 * 60 * 60 * 24);
    const hoursSinceBooking = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    // Grace period check
    const inGracePeriod = hoursSinceBooking <= GRACE_PERIOD_HOURS && daysUntilCheckIn >= GRACE_MIN_DAYS_AHEAD;
    if (inGracePeriod) {
        return {
            refundAmount: Math.round(totalPrice * 100) / 100,
            inGracePeriod: true,
            reason: "Cancelled within the 24-hour grace period — full refund.",
            policy,
        };
    }
    const policyDef = exports.CANCELLATION_POLICIES[policy];
    for (const rule of policyDef.rules) {
        if (daysUntilCheckIn >= rule.daysBeforeCheckIn) {
            const refundAmount = Math.round(hostPayout * rule.refundOfHostPayout * 100) / 100;
            const pct = (rule.refundOfHostPayout * 100).toFixed(0);
            let reason;
            if (refundAmount === 0) {
                reason = `Non-refundable under the ${policyDef.name} policy — within the no-refund window.`;
            }
            else if (rule.refundOfHostPayout === 1.0) {
                reason = `Cancelled within the full-refund window — host payout returned.`;
            }
            else {
                reason = `${pct}% of host payout refunded under the ${policyDef.name} policy.`;
            }
            return { refundAmount, inGracePeriod: false, reason, policy };
        }
    }
    return {
        refundAmount: 0,
        inGracePeriod: false,
        reason: "Non-refundable — outside all refund windows.",
        policy,
    };
}
//# sourceMappingURL=cancellationPolicies.js.map