import { User } from "./User";
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
import { Hotel } from "./Hotel";
import { EventCenter } from "./EventCenter";
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
    hotel: Hotel | null;
    hotelId: string | null;
    eventCenter: EventCenter | null;
    eventCenterId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Review.d.ts.map