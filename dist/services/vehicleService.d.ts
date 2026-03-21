import { Vehicle } from "../entities/Vehicle";
interface CreateVehicleInput {
    make: string;
    model: string;
    year: number;
    vehicleType: string;
    pricePerDay: number;
    priceWithDriverPerDay?: number | null;
    description: string;
    seats: number;
    withDriver?: boolean;
    location?: string;
    features?: string[];
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
}
export declare const vehicleService: VehicleService;
export {};
//# sourceMappingURL=vehicleService.d.ts.map