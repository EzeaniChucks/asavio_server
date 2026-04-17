import { SavedItem } from "../entities/SavedItem";
declare class SavedItemService {
    private get repo();
    /** Toggle save. Returns { saved: true } if added, { saved: false } if removed. */
    toggle(userId: string, propertyId?: string, vehicleId?: string, hotelId?: string, eventCenterId?: string): Promise<{
        saved: boolean;
    }>;
    /** Returns a paginated list of saved properties for a user (with images). */
    getSavedProperties(userId: string, page?: number, limit?: number): Promise<{
        items: SavedItem[];
        total: number;
        page: number;
        limit: number;
    }>;
    /** Returns the set of saved IDs for a user — for bulk "is saved?" checks. */
    getSavedIds(userId: string): Promise<{
        propertyIds: string[];
        vehicleIds: string[];
        hotelIds: string[];
        eventCenterIds: string[];
    }>;
}
export declare const savedItemService: SavedItemService;
export {};
//# sourceMappingURL=savedItemService.d.ts.map