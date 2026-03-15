import { User } from "./User";
import { Property } from "./Property";
export type BookingStatus = "awaiting_payment" | "confirmed" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type HostPayoutStatus = "pending" | "processing" | "transferred" | "failed";
export declare class Booking {
    id: string;
    user: User;
    userId: string;
    property: Property;
    propertyId: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    totalPrice: number;
    platformCommission: number;
    hostPayout: number;
    status: BookingStatus;
    paymentMethod: string;
    paymentStatus: PaymentStatus;
    paystackReference: string;
    hostPayoutStatus: HostPayoutStatus;
    payoutReference: string;
    paymentNotes: string;
    specialRequests: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Booking.d.ts.map