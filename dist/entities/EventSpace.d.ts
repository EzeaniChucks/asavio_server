import { EventCenter } from "./EventCenter";
import { EventSpaceImage } from "./EventSpaceImage";
export declare class EventSpace {
    id: string;
    name: string;
    description: string | null;
    /** Maximum attendees this space can hold */
    capacity: number;
    /**
     * Pricing model:
     * - "hourly": charged per hour (hourlyRate × hours)
     * - "daily": flat daily rate (one event per day locks the space)
     * - "package": fixed package price (includes X hours + description)
     * - "hybrid": host sets both hourly + daily; guest picks
     */
    pricingMode: "hourly" | "daily" | "package" | "hybrid";
    /** Price per hour (used when pricingMode = "hourly" or "hybrid") */
    hourlyRate: number | null;
    /** Minimum hours for hourly bookings (default 4) */
    minHours: number;
    /** Flat daily rate (used when pricingMode = "daily" or "hybrid") */
    dailyRate: number | null;
    /** Package name (e.g. "Wedding Package") — used when pricingMode = "package" */
    packageName: string | null;
    /** Package price — fixed total cost */
    packageRate: number | null;
    /** How many hours the package includes */
    packageHoursIncluded: number | null;
    /** Free-text package description */
    packageDescription: string | null;
    /** Buffer before each event (minutes) for setup */
    setupMinutes: number;
    /** Buffer after each event (minutes) for teardown */
    teardownMinutes: number;
    eventCenter: EventCenter;
    eventCenterId: string;
    images: EventSpaceImage[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=EventSpace.d.ts.map