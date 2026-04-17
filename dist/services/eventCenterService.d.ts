import { EventCenter } from "../entities/EventCenter";
import { EventSpace } from "../entities/EventSpace";
interface CreateEventCenterInput {
    name: string;
    description: string;
    location: EventCenter["location"];
    amenities?: string[];
    nearbyPlaces?: string[] | null;
    allowedEventTypes?: string[];
    blockedEventTypes?: string[];
    cancellationPolicy?: string;
}
interface EventCenterFilters {
    city?: string;
    eventType?: string;
    minCapacity?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: "price_asc" | "price_desc" | "rating" | "newest";
    page?: number;
    limit?: number;
}
interface CreateEventSpaceInput {
    name: string;
    description?: string;
    capacity: number | string;
    pricingMode: "hourly" | "daily" | "package" | "hybrid";
    hourlyRate?: number | string | null;
    minHours?: number | string;
    dailyRate?: number | string | null;
    packageName?: string;
    packageRate?: number | string | null;
    packageHoursIncluded?: number | string | null;
    packageDescription?: string;
    setupMinutes?: number | string;
    teardownMinutes?: number | string;
}
declare class EventCenterService {
    private get ecRepo();
    private get spaceRepo();
    private get ecImgRepo();
    private get esImgRepo();
    createEventCenter(hostId: string, input: CreateEventCenterInput, files: Express.Multer.File[]): Promise<EventCenter>;
    getById(id: string): Promise<EventCenter>;
    getAll(filters?: EventCenterFilters): Promise<{
        eventCenters: EventCenter[];
        total: number;
    }>;
    getHostEventCenters(hostId: string): Promise<EventCenter[]>;
    update(id: string, hostId: string, role: string, updates: Partial<CreateEventCenterInput> & {
        isAvailable?: boolean;
    }, files?: Express.Multer.File[]): Promise<EventCenter>;
    deleteEventCenter(id: string, hostId: string, role: string): Promise<void>;
    toggleAvailability(id: string, hostId: string): Promise<EventCenter>;
    createSpace(eventCenterId: string, hostId: string, role: string, input: CreateEventSpaceInput, files: Express.Multer.File[]): Promise<EventSpace>;
    getSpaceById(id: string): Promise<EventSpace>;
    updateSpace(spaceId: string, hostId: string, role: string, updates: Partial<CreateEventSpaceInput>, files?: Express.Multer.File[]): Promise<EventSpace>;
    deleteSpace(spaceId: string, hostId: string, role: string): Promise<void>;
}
export declare const eventCenterService: EventCenterService;
export {};
//# sourceMappingURL=eventCenterService.d.ts.map