import { User } from "./User";
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
import { Hotel } from "./Hotel";
import { EventCenter } from "./EventCenter";
/**
 * One row per saved listing per user.
 * Exactly one of propertyId, vehicleId, or hotelId is set.
 */
export declare class SavedItem {
    id: string;
    userId: string;
    propertyId: string | null;
    vehicleId: string | null;
    hotelId: string | null;
    eventCenterId: string | null;
    user: User;
    property: Property;
    vehicle: Vehicle;
    hotel: Hotel | null;
    eventCenter: EventCenter | null;
    createdAt: Date;
}
//# sourceMappingURL=SavedItem.d.ts.map