import { Vehicle } from "../entities/Vehicle";
interface CreateVehicleInput {
    make: string;
    model: string;
    year: number;
    vehicleType: string;
    pricePerDay: number;
    priceWithDriverPerDay?: number | null;
    cautionFee?: number | string | null;
    description: string;
    seats: number;
    withDriver?: boolean;
    location?: string;
    features?: string[];
    cancellationPolicy?: string;
    travelZone?: string;
    allowInterstate?: boolean | string;
    interstateSurchargePerDay?: number | string | null;
}
interface VehicleFilters {
    vehicleType?: string;
    minPrice?: number;
    maxPrice?: number;
    withDriver?: boolean;
    location?: string;
    seats?: number;
    sort?: "price_asc" | "price_desc" | "rating" | "newest";
    page?: number;
    limit?: number;
}
declare class VehicleService {
    private get repo();
    createVehicle(hostId: string, input: CreateVehicleInput, files: Express.Multer.File[]): Promise<Vehicle>;
    getAvailableVehicleTypes(): Promise<string[]>;
    getVehicleTypeRepresentatives(): Promise<Vehicle[]>;
    getVehicles(filters?: VehicleFilters): Promise<{
        vehicles: Vehicle[];
        total: number;
    }>;
    getVehicleById(id: string): Promise<Vehicle>;
    getHostVehicles(hostId: string): Promise<Vehicle[]>;
    updateVehicle(id: string, hostId: string, role: string, updates: Partial<CreateVehicleInput> & {
        isAvailable?: boolean;
    }, files?: Express.Multer.File[]): Promise<Vehicle>;
    deleteVehicle(id: string, hostId: string, role: string): Promise<void>;
    toggleAvailability(id: string, hostId: string): Promise<Vehicle>;
    /**
     * Returns all booked date ranges (confirmed/awaiting_payment) PLUS host-blocked
     * date ranges for a given vehicle, combined into a single list for calendar display.
     */
    getBookedDates(vehicleId: string): Promise<{
        checkIn: string;
        checkOut: string;
    }[]>;
    /** Host/admin: replace the full blockedDates array for a vehicle */
    updateBlockedDates(vehicleId: string, hostId: string, role: string, blockedDates: {
        from: string;
        to: string;
    }[]): Promise<void>;
}
export declare const vehicleService: VehicleService;
export {};
//# sourceMappingURL=vehicleService.d.ts.map