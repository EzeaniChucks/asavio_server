import { User } from "./User";
import { EventCenter } from "./EventCenter";
import { EventSpace } from "./EventSpace";
export type EventBookingStatus = "awaiting_payment" | "confirmed" | "cancelled" | "completed";
export type EventPaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type EventPayoutStatus = "pending" | "processing" | "transferred" | "failed";
export declare class EventBooking {
    id: string;
    user: User;
    userId: string;
    eventCenter: EventCenter;
    eventCenterId: string;
    eventSpace: EventSpace;
    eventSpaceId: string;
    /** The date of the event (single date, not a range) */
    eventDate: Date;
    /** Event start time (HH:MM, 24-hour) */
    startTime: string;
    /** Event end time (HH:MM, 24-hour) */
    endTime: string;
    /** What kind of event (e.g. "wedding", "corporate", "birthday") */
    eventType: string;
    /** Number of expected attendees (capped at space.capacity) */
    attendeeCount: number;
    /** Which pricing mode was used to calculate ("hourly", "daily", or "package") */
    pricingUsed: "hourly" | "daily" | "package";
    totalPrice: number;
    platformCommission: number;
    hostPayout: number;
    appliedCommissionRate: number | null;
    currency: string;
    status: EventBookingStatus;
    paymentMethod: string;
    paymentStatus: EventPaymentStatus;
    paystackReference: string;
    hostPayoutStatus: EventPayoutStatus;
    payoutReference: string;
    specialRequests: string | null;
    refundedAmount: number | null;
    cancelledAt: Date | null;
    cancelledBy: "guest" | "host" | "admin" | null;
    cancellationReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=EventBooking.d.ts.map