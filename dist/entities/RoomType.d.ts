import { Hotel } from "./Hotel";
import { RoomTypeImage } from "./RoomTypeImage";
export declare class RoomType {
    id: string;
    name: string;
    description: string | null;
    pricePerNight: number;
    maxGuests: number;
    /** How many units of this room type the hotel has */
    totalUnits: number;
    /** "king" | "queen" | "twin" | "bunk" | "sofa-bed" | "double" */
    bedType: string;
    /** Room size (free-text, e.g. "35 sqm") */
    roomSize: string;
    /** Per-room amenities (AC, TV, minibar, safe, balcony) */
    roomAmenities: string[];
    /** Optional refundable caution fee (advisory — host-collected) */
    cautionFee: number | null;
    hotel: Hotel;
    hotelId: string;
    images: RoomTypeImage[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=RoomType.d.ts.map