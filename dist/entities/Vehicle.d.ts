import { User } from "./User";
export declare class Vehicle {
    id: string;
    make: string;
    model: string;
    year: number;
    vehicleType: string;
    pricePerDay: number;
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
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Vehicle.d.ts.map