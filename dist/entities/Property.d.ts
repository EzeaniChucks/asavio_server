import { User } from "./User";
import { Booking } from "./Booking";
import { Review } from "./Review";
import { Image } from "./Image";
export declare class Property {
    id: string;
    title: string;
    description: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    maxGuests: number;
    /** Default/base price per night — used when no purpose-specific price applies */
    pricePerNight: number;
    /**
     * Optional per-purpose pricing map, e.g.:
     * { "Birthday party": 75000, "House party": 100000 }
     * Null = no purpose-based pricing; single price for all purposes.
     */
    purposePricing: Record<string, number> | null;
    amenities: string[];
    location: {
        address: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
        latitude: number;
        longitude: number;
    };
    isAvailable: boolean;
    /**
     * Host-managed blocked date ranges.
     * Each entry blocks the property from {from} (inclusive) to {to} (exclusive).
     * e.g. [{ "from": "2025-06-01", "to": "2025-06-05" }]
     */
    blockedDates: {
        from: string;
        to: string;
    }[] | null;
    status: string;
    rejectionReason?: string;
    host: User;
    hostId: string;
    images: Image[];
    bookings: Booking[];
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Property.d.ts.map