import { User } from "./User";
import { Property } from "./Property";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";
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
    status: BookingStatus;
    specialRequests: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Booking.d.ts.map