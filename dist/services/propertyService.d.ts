import { Property } from "../entities/Property";
export declare class PropertyService {
    private propertyRepository;
    private imageRepository;
    createProperty(propertyData: any, hostId: string, images?: any[]): Promise<Property>;
    getPropertyById(id: string, trackView?: boolean): Promise<Property>;
    /**
     * Returns analytics data for a host's portfolio.
     * Used by the host earnings/analytics dashboard.
     */
    getHostAnalytics(hostId: string): Promise<{
        totalRevenue: number;
        totalViews: number;
        totalBookings: number;
        conversionRate: number;
        revenueByDay: Array<{
            date: string;
            revenue: number;
        }>;
        topListings: Array<{
            propertyId: string;
            title: string;
            revenue: number;
            views: number;
            bookings: number;
        }>;
    }>;
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
    getTypeRepresentatives(): Promise<Array<{
        type: string;
        image: string;
        propertyId: string;
    }>>;
    updateProperty(id: string, updateData: any, hostId: string, removeImagePublicIds?: string[], files?: Express.Multer.File[]): Promise<Property>;
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