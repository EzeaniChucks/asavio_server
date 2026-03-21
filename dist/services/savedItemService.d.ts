import { SavedItem } from "../entities/SavedItem";
declare class SavedItemService {
    private get repo();
    /** Toggle save. Returns { saved: true } if added, { saved: false } if removed. */
    toggle(userId: string, propertyId?: string, vehicleId?: string): Promise<{
        saved: boolean;
    }>;
    /** Returns all saved properties for a user (with images). */
    getSavedProperties(userId: string): Promise<SavedItem[]>;
    /** Returns the set of saved propertyIds for a user — for bulk "is saved?" checks. */
    getSavedIds(userId: string): Promise<{
        propertyIds: string[];
        vehicleIds: string[];
    }>;
}
export declare const savedItemService: SavedItemService;
export {};
//# sourceMappingURL=savedItemService.d.ts.map