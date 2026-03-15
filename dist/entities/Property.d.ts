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
    pricePerNight: number;
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