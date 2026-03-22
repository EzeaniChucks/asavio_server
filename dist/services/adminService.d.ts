import { User } from "../entities/User";
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
        pendingListings: number;
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
            bankAccountNumber: string;
            bankCode: string;
            bankAccountName: string;
            bankName: string;
            paystackRecipientCode: string;
            commissionRateOverride: number | null;
            kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
            kycDocumentType: string;
            kycDocumentUrl: string;
            kycDocumentPublicId: string;
            kycSubmittedAt: Date | null;
            kycReviewedAt: Date | null;
            kycRejectionReason: string;
            hostTier: "new_host" | "trusted_host" | "top_host";
            responseRate: number;
            lastSeen: Date | null;
            passwordResetToken: string;
            passwordResetExpires: Date | null;
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
        commissionRateOverride: number | null;
    }>): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone: string;
        profileImage: string;
        role: string;
        isVerified: boolean;
        bankAccountNumber: string;
        bankCode: string;
        bankAccountName: string;
        bankName: string;
        paystackRecipientCode: string;
        commissionRateOverride: number | null;
        kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
        kycDocumentType: string;
        kycDocumentUrl: string;
        kycDocumentPublicId: string;
        kycSubmittedAt: Date | null;
        kycReviewedAt: Date | null;
        kycRejectionReason: string;
        hostTier: "new_host" | "trusted_host" | "top_host";
        responseRate: number;
        lastSeen: Date | null;
        passwordResetToken: string;
        passwordResetExpires: Date | null;
        properties: Property[];
        bookings: Booking[];
        reviews: Review[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteUser(id: string): Promise<void>;
    getHostProperties(hostId: string): Promise<{
        host: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phone: string;
            profileImage: string;
            role: string;
            isVerified: boolean;
            bankAccountNumber: string;
            bankCode: string;
            bankAccountName: string;
            bankName: string;
            paystackRecipientCode: string;
            commissionRateOverride: number | null;
            kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
            kycDocumentType: string;
            kycDocumentUrl: string;
            kycDocumentPublicId: string;
            kycSubmittedAt: Date | null;
            kycReviewedAt: Date | null;
            kycRejectionReason: string;
            hostTier: "new_host" | "trusted_host" | "top_host";
            responseRate: number;
            lastSeen: Date | null;
            passwordResetToken: string;
            passwordResetExpires: Date | null;
            properties: Property[];
            bookings: Booking[];
            reviews: Review[];
            createdAt: Date;
            updatedAt: Date;
        };
        properties: Property[];
    }>;
    getProperties(opts: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    }): Promise<{
        properties: Property[];
        total: number;
    }>;
    updateProperty(id: string, updates: Record<string, any>): Promise<Property>;
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
    getAudienceRecipients(audience: "all" | "users" | "hosts" | "verified_hosts" | "unverified_hosts" | "guests_with_bookings"): Promise<User[]>;
    previewAudienceCount(audience: "all" | "users" | "hosts" | "verified_hosts" | "unverified_hosts" | "guests_with_bookings"): Promise<{
        count: number;
    }>;
    sendBroadcast(opts: {
        audience: "all" | "users" | "hosts" | "verified_hosts" | "unverified_hosts" | "guests_with_bookings";
        subject: string;
        message?: string;
        htmlBody?: string;
    }): Promise<{
        sent: number;
    }>;
}
export declare const adminService: AdminService;
export {};
//# sourceMappingURL=adminService.d.ts.map