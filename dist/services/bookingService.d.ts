import { Booking, BookingStatus } from "../entities/Booking";
interface CreateBookingInput {
    propertyId?: string;
    vehicleId?: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    withDriver?: boolean;
    purpose?: string;
    specialRequests?: string;
}
export declare class BookingService {
    private bookingRepo;
    private propertyRepo;
    private vehicleRepo;
    private nightsBetween;
    /** Returns true when there is a conflicting active booking for the given property or vehicle */
    private hasConflict;
    /** Returns true if the date range overlaps any host-blocked range on the property */
    private isBlocked;
    createBooking(userId: string, input: CreateBookingInput): Promise<Booking>;
    getBookingById(id: string, requesterId: string, requesterRole?: string): Promise<Booking>;
    getUserBookings(userId: string): Promise<Booking[]>;
    getHostBookings(hostId: string): Promise<Booking[]>;
    updateBookingStatus(id: string, status: BookingStatus, requesterId: string, requesterRole: string): Promise<Booking | null>;
    checkAvailability(propertyId: string, checkIn: string, checkOut: string, purpose?: string): Promise<{
        available: boolean;
        pricePerNight: number;
        nights: number;
        totalPrice: number;
        purposePricing: Record<string, number> | null;
    }>;
    checkVehicleAvailability(vehicleId: string, checkIn: string, checkOut: string, withDriver?: boolean): Promise<{
        available: boolean;
        pricePerDay: number;
        priceWithDriverPerDay: number | null;
        days: number;
        totalPrice: number;
    }>;
    /** Returns booked date ranges for a vehicle (for calendar display) */
    getVehicleBookedDates(vehicleId: string): Promise<{
        checkIn: string;
        checkOut: string;
    }[]>;
}
export {};
//# sourceMappingURL=bookingService.d.ts.map