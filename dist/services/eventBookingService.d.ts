import { EventBooking } from "../entities/EventBooking";
interface CreateEventBookingInput {
    eventCenterId: string;
    eventSpaceId: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    eventType: string;
    attendeeCount: number | string;
    pricingUsed: "hourly" | "daily" | "package";
    specialRequests?: string;
}
declare class EventBookingService {
    private get repo();
    /**
     * Returns booked time slots for a specific space on a given date.
     * Used by the frontend to grey out unavailable hours.
     */
    getSlots(eventSpaceId: string, eventDate: string): Promise<{
        startTime: string;
        endTime: string;
        status: string;
    }[]>;
    /**
     * Checks if a proposed slot overlaps with any existing booking.
     * Includes setup + teardown buffers.
     * For daily-mode spaces, any booking on the date = conflict.
     */
    private hasConflict;
    createBooking(userId: string, input: CreateEventBookingInput): Promise<EventBooking>;
    getById(id: string, requesterId: string, requesterRole?: string): Promise<EventBooking>;
    getUserBookings(userId: string): Promise<EventBooking[]>;
    getHostBookings(hostId: string): Promise<EventBooking[]>;
    updateStatus(id: string, status: "confirmed" | "cancelled" | "completed", requesterId: string, requesterRole: string, cancellationReason?: string): Promise<EventBooking>;
}
export declare const eventBookingService: EventBookingService;
export {};
//# sourceMappingURL=eventBookingService.d.ts.map