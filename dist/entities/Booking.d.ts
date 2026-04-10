import { User } from "./User";
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
export type BookingStatus = "awaiting_payment" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type HostPayoutStatus = "pending" | "processing" | "transferred" | "failed";
export declare class Booking {
    id: string;
    user: User;
    userId: string;
    property: Property | null;
    propertyId: string | null;
    vehicle: Vehicle | null;
    vehicleId: string | null;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalPrice: number;
    platformCommission: number;
    hostPayout: number;
    /** Commission rate actually applied at booking creation time (for audit trail) */
    appliedCommissionRate: number | null;
    status: BookingStatus;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    paystackReference: string;
    hostPayoutStatus: HostPayoutStatus;
    payoutReference: string;
    paymentNotes: string;
    /**
     * ISO 4217 currency code for this booking (e.g. "NGN", "USD", "GBP").
     * Defaults to "NGN". When international markets are added, set this at booking
     * creation time based on the property's market / guest's preference.
     * All monetary fields (totalPrice, platformCommission, hostPayout) are stored
     * in this currency. Use this field everywhere you format or display amounts.
     */
    currency: string;
    /** Purpose of the booking — used for purpose-based pricing (e.g. "Birthday party") */
    purpose: string;
    specialRequests: string;
    /** Amount refunded to the guest when the booking was cancelled (null = no refund yet) */
    refundedAmount: number | null;
    /** When the booking was cancelled */
    cancelledAt: Date | null;
    /** Who initiated the cancellation: "guest" | "host" | "admin" */
    cancelledBy: "guest" | "host" | "admin" | null;
    /** Optional free-text reason for cancellation */
    cancellationReason: string | null;
    /** "local" = within the vehicle's travelZone; "interstate" = cross-state travel */
    travelScope: "local" | "interstate" | null;
    /** Guest-declared destination for interstate trips (free text) */
    destination: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Booking.d.ts.map