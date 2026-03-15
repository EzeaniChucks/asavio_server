import { Booking, BookingStatus } from "../entities/Booking";
interface CreateBookingInput {
    propertyId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    specialRequests?: string;
}
export declare class BookingService {
    private bookingRepo;
    private propertyRepo;
    private nightsBetween;
    /** Returns true when the property has a conflicting confirmed/pending booking */
    private hasConflict;
    createBooking(userId: string, input: CreateBookingInput): Promise<Booking>;
    getBookingById(id: string, requesterId: string, requesterRole?: string): Promise<Booking>;
    getUserBookings(userId: string): Promise<Booking[]>;
    getHostBookings(hostId: string): Promise<Booking[]>;
    updateBookingStatus(id: string, status: BookingStatus, requesterId: string, requesterRole: string): Promise<Booking | null>;
    checkAvailability(propertyId: string, checkIn: string, checkOut: string): Promise<{
        available: boolean;
        pricePerNight: number;
        nights: number;
        totalPrice: number;
    }>;
}
export {};
//# sourceMappingURL=bookingService.d.ts.map