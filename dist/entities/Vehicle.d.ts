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
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
    averageRating: number;
    totalReviews: number;
    host: User;
    hostId: string;
    bookings: Booking[];
    /**
     * Cancellation policy for this listing.
     * One of: "flexible" | "moderate" | "firm" | "strict"
     * Default: "flexible"
     */
    cancellationPolicy: string;
    /**
     * Host-blocked date ranges — guests cannot book dates that fall within any of these.
     * Format: [{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }]  (to is exclusive)
     */
    blockedDates: {
        from: string;
        to: string;
    }[];
    /** Private check-in/pickup instructions sent to the guest 24 h before pickup. */
    checkInInstructions?: string;
    /** Optional refundable caution fee amount displayed to guests. Not processed by Asavio. */
    cautionFee: number | null;
    /** Cloudinary secure URL of the feature video, if uploaded */
    featureVideoUrl: string | null;
    /** Cloudinary public_id of the feature video, for deletion */
    featureVideoPublicId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Vehicle.d.ts.map