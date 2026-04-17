import { Booking, BookingStatus } from "../entities/Booking";
import { RefundEstimate } from "../constants/cancellationPolicies";
interface CreateBookingInput {
    propertyId?: string;
    vehicleId?: string;
    hotelId?: string;
    roomTypeId?: string;
    quantity?: number;
    checkIn: string;
    checkOut: string;
    guests: number;
    withDriver?: boolean;
    purpose?: string;
    specialRequests?: string;
    travelScope?: "local" | "interstate";
    destination?: string;
}
export declare class BookingService {
    private bookingRepo;
    private propertyRepo;
    private vehicleRepo;
    private hotelRepo;
    private roomTypeRepo;
    private nightsBetween;
    /** Returns true when there is a conflicting active booking for the given property or vehicle */
    private hasConflict;
    /**
     * For hotel bookings: returns the number of rooms of a given type already booked
     * that overlap the requested date range. Used to confirm room-type capacity.
     */
    private countBookedRoomsOfType;
    /** Returns true if the date range overlaps any host-blocked range on the property */
    private isBlocked;
    createBooking(userId: string, input: CreateBookingInput): Promise<Booking>;
    getBookingById(id: string, requesterId: string, requesterRole?: string): Promise<Booking>;
    getUserBookings(userId: string): Promise<Booking[]>;
    getHostBookings(hostId: string): Promise<Booking[]>;
    /** Booked date ranges for a specific room type (for calendar display) */
    getHotelRoomBookedDates(roomTypeId: string): Promise<{
        checkIn: string;
        checkOut: string;
        quantity: number;
    }[]>;
    updateBookingStatus(id: string, status: BookingStatus, requesterId: string, requesterRole: string, cancellationReason?: string): Promise<Booking | null>;
    /**
     * Returns a refund estimate for a booking without modifying anything.
     * Used so the frontend can show the guest what they'll receive before they confirm cancellation.
     */
    getCancellationEstimate(id: string, requesterId: string, requesterRole: string): Promise<RefundEstimate & {
        listingTitle: string;
        totalPaid: number;
    }>;
    checkAvailability(propertyId: string, checkIn: string, checkOut: string, purpose?: string): Promise<{
        available: boolean;
        pricePerNight: number;
        nights: number;
        totalPrice: number;
        purposePricing: Record<string, number> | null;
    }>;
    checkVehicleAvailability(vehicleId: string, checkIn: string, checkOut: string, withDriver?: boolean, travelScope?: "local" | "interstate"): Promise<{
        available: boolean;
        pricePerDay: number;
        priceWithDriverPerDay: number | null;
        interstateSurchargePerDay: number | null;
        effectiveDailyRate: number;
        travelZone: string;
        allowInterstate: boolean;
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