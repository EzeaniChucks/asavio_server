import { User } from "./User";
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
/**
 * One row per saved listing per user.
 * Either propertyId OR vehicleId is set — never both.
 */
export declare class SavedItem {
    id: string;
    userId: string;
    propertyId: string | null;
    vehicleId: string | null;
    user: User;
    property: Property;
    vehicle: Vehicle;
    createdAt: Date;
}
//# sourceMappingURL=SavedItem.d.ts.map