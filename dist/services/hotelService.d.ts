import { Hotel } from "../entities/Hotel";
import { RoomType } from "../entities/RoomType";
interface CreateHotelInput {
    name: string;
    description: string;
    hotelType?: string;
    starRating?: number | string | null;
    location: Hotel["location"];
    amenities?: string[];
    nearbyPlaces?: string[] | null;
    checkInTime?: string;
    checkOutTime?: string;
    cancellationPolicy?: string;
    checkInInstructions?: string;
}
interface HotelFilters {
    city?: string;
    hotelType?: string;
    star?: number;
    minPrice?: number;
    maxPrice?: number;
    guests?: number;
    sort?: "price_asc" | "price_desc" | "rating" | "newest";
    page?: number;
    limit?: number;
}
interface CreateRoomTypeInput {
    name: string;
    description?: string;
    pricePerNight: number | string;
    maxGuests: number | string;
    totalUnits?: number | string;
    bedType?: string;
    roomSize?: string;
    roomAmenities?: string[];
    cautionFee?: number | string | null;
}
declare class HotelService {
    private get hotelRepo();
    private get roomRepo();
    private get hotelImgRepo();
    private get roomImgRepo();
    private get bookingRepo();
    createHotel(hostId: string, input: CreateHotelInput, files: Express.Multer.File[]): Promise<Hotel>;
    getHotelById(id: string): Promise<Hotel>;
    getHotels(filters?: HotelFilters): Promise<{
        hotels: Hotel[];
        total: number;
    }>;
    getHostHotels(hostId: string): Promise<Hotel[]>;
    /**
     * Returns one representative hotel per hotelType for the homepage "browse by type" section.
     */
    getHotelTypeRepresentatives(): Promise<Hotel[]>;
    getAvailableHotelTypes(): Promise<string[]>;
    updateHotel(id: string, hostId: string, role: string, updates: Partial<CreateHotelInput> & {
        isAvailable?: boolean;
    }, files?: Express.Multer.File[]): Promise<Hotel>;
    deleteHotel(id: string, hostId: string, role: string): Promise<void>;
    toggleAvailability(id: string, hostId: string): Promise<Hotel>;
    createRoomType(hotelId: string, hostId: string, role: string, input: CreateRoomTypeInput, files: Express.Multer.File[]): Promise<RoomType>;
    getRoomTypeById(id: string): Promise<RoomType>;
    updateRoomType(roomId: string, hostId: string, role: string, updates: Partial<CreateRoomTypeInput>, files?: Express.Multer.File[]): Promise<RoomType>;
    deleteRoomType(roomId: string, hostId: string, role: string): Promise<void>;
    /**
     * Returns all room types for a hotel with `available` units for the given date range.
     * `available` = totalUnits - (sum of overlapping booked quantities).
     */
    getRoomAvailability(hotelId: string, checkIn: string, checkOut: string): Promise<Array<RoomType & {
        available: number;
    }>>;
}
export declare const hotelService: HotelService;
export {};
//# sourceMappingURL=hotelService.d.ts.map