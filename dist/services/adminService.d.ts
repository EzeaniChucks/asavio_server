import { Property } from "../entities/Property";
import { Vehicle } from "../entities/Vehicle";
import { Booking } from "../entities/Booking";
import { Review } from "../entities/Review";
declare class AdminService {
    getStats(): Promise<{
        totalUsers: number;
        totalHosts: number;
        totalProperties: number;
        totalVehicles: number;
        totalBookings: number;
        totalReviews: number;
        pendingBookings: number;
        totalRevenue: number;
    }>;
    getUsers(opts: {
        page?: number;
        limit?: number;
        role?: string;
        search?: string;
    }): Promise<{
        users: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            profileImage: string;
            role: string;
            isVerified: boolean;
            properties: Property[];
            bookings: Booking[];
            reviews: Review[];
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
    }>;
    updateUser(id: string, updates: Partial<{
        role: string;
        isVerified: boolean;
        firstName: string;
        lastName: string;
    }>): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        profileImage: string;
        role: string;
        isVerified: boolean;
        properties: Property[];
        bookings: Booking[];
        reviews: Review[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteUser(id: string): Promise<void>;
    getProperties(opts: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        properties: Property[];
        total: number;
    }>;
    updateProperty(id: string, updates: Partial<{
        isAvailable: boolean;
        title: string;
    }>): Promise<Property>;
    deleteProperty(id: string): Promise<void>;
    getVehicles(opts: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{
        vehicles: Vehicle[];
        total: number;
    }>;
    deleteVehicle(id: string): Promise<void>;
    getBookings(opts: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        bookings: Booking[];
        total: number;
    }>;
    updateBookingStatus(id: string, status: string): Promise<Booking>;
    deleteReview(id: string): Promise<void>;
    sendBroadcast(opts: {
        audience: "all" | "hosts" | "users";
        subject: string;
        message: string;
    }): Promise<{
        sent: number;
    }>;
}
export declare const adminService: AdminService;
export {};
//# sourceMappingURL=adminService.d.ts.map