import { User } from "./User";
import { EventSpace } from "./EventSpace";
import { EventCenterImage } from "./EventCenterImage";
export declare class EventCenter {
    id: string;
    name: string;
    description: string;
    location: {
        address: string;
        city: string;
        state: string;
        country: string;
        zipCode: string;
        latitude?: number;
        longitude?: number;
    };
    /** Venue-wide amenities (AV, stage, parking, catering kitchen, AC) */
    amenities: string[];
    /** Places of interest nearby */
    nearbyPlaces: string[] | null;
    /**
     * Event types the host allows at this venue.
     * e.g. ["wedding", "corporate", "birthday", "photoshoot"]
     * Empty array = all types welcome.
     */
    allowedEventTypes: string[];
    /**
     * Explicit blocklist — overrides allowedEventTypes even if both are set.
     * e.g. ["political", "nightclub"]
     */
    blockedEventTypes: string[];
    cancellationPolicy: string;
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
    spaces: EventSpace[];
    images: EventCenterImage[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=EventCenter.d.ts.map