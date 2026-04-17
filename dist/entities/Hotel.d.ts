import { User } from "./User";
import { RoomType } from "./RoomType";
import { HotelImage } from "./HotelImage";
export declare class Hotel {
    id: string;
    name: string;
    description: string;
    /** Sub-category, e.g. "Beach Resort", "City Hotel", "Boutique", "Budget" */
    hotelType: string;
    /**
     * Host-declared star rating (1-5). Shown to guests with a "verified" flag
     * once admin flips verifiedStarRating = true during moderation.
     */
    starRating: number | null;
    verifiedStarRating: boolean;
    location: {
        address: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
        latitude?: number;
        longitude?: number;
    };
    /** Hotel-wide amenities (pool, gym, restaurant, front desk, parking) */
    amenities: string[];
    /** Places of interest nearby */
    nearbyPlaces: string[] | null;
    /** Default check-in time (e.g. "14:00") */
    checkInTime: string;
    /** Default check-out time (e.g. "11:00") */
    checkOutTime: string;
    cancellationPolicy: string;
    checkInInstructions?: string;
    status: string;
    rejectionReason?: string;
    isAvailable: boolean;
    averageRating: number;
    totalReviews: number;
    viewCount: number;
    featureVideoUrl: string | null;
    featureVideoPublicId: string | null;
    host: User;
    hostId: string;
    roomTypes: RoomType[];
    images: HotelImage[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Hotel.d.ts.map