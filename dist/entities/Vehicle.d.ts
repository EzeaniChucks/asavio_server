import { User } from "./User";
import { Booking } from "./Booking";
export declare class Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    vehicleType: string;
    /** Self-drive daily price (always required) */
    pricePerDay: number;
    /** Driver option daily price — null means no driver option available */
    priceWithDriverPerDay: number | null;
    description: string;
    features: string[];
    images: {
        url: string;
        publicId: string;
    }[];
    isAvailable: boolean;
    location: string;
    seats: number;
    withDriver: boolean;
    averageRating: number;
    totalReviews: number;
    host: User;
    hostId: string;
    bookings: Booking[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Vehicle.d.ts.map