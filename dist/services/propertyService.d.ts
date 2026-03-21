import { Property } from "../entities/Property";
export declare class PropertyService {
    private propertyRepository;
    private imageRepository;
    createProperty(propertyData: any, hostId: string, images?: any[]): Promise<Property>;
    getPropertyById(id: string): Promise<Property>;
    getMyProperties(hostId: string): Promise<Property[]>;
    getAllProperties(filters: any): Promise<Property[]>;
    /**
     * Returns three curated slices for the home page discovery sections.
     *
     * topPicks and popular use native SQL to sort by expressions TypeORM can't
     * express in orderBy() without alias-resolution issues. IDs are fetched via
     * raw query, then full entities are loaded and re-sorted to preserve order.
     */
    getHomeSections(): Promise<{
        topPicks: Property[];
        newlyListed: Property[];
        popular: Property[];
    }>;
    getAvailablePropertyTypes(): Promise<string[]>;
    updateProperty(id: string, updateData: any, hostId: string): Promise<Property>;
    deleteProperty(id: string, hostId: string): Promise<void>;
    /**
     * Returns all booked date ranges (confirmed/awaiting_payment) PLUS host-blocked
     * date ranges for a given property, combined into a single list the frontend uses
     * to disable unavailable days on the calendar.
     */
    getBookedDates(propertyId: string): Promise<{
        checkIn: string;
        checkOut: string;
    }[]>;
    /** Host: replace the full blockedDates array for a property */
    updateBlockedDates(propertyId: string, hostId: string, blockedDates: {
        from: string;
        to: string;
    }[]): Promise<void>;
}
//# sourceMappingURL=propertyService.d.ts.map