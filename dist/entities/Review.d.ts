import { User } from "./User";
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
export declare class Review {
    id: string;
    rating: number;
    comment: string;
    user: User;
    userId: string;
    property: Property;
    propertyId: string;
    vehicle: Vehicle;
    vehicleId: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Review.d.ts.map