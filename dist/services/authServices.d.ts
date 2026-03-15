import { User } from "../entities/User";
interface RegisterInput {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: "user" | "host";
    phone?: string;
}
interface LoginInput {
    email: string;
    password: string;
}
export declare class AuthService {
    private userRepository;
    register(input: RegisterInput): Promise<{
        user: {
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
            properties: import("../entities/Property").Property[];
            bookings: import("../entities/Booking").Booking[];
            reviews: import("../entities/Review").Review[];
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    login(input: LoginInput): Promise<{
        user: {
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
            properties: import("../entities/Property").Property[];
            bookings: import("../entities/Booking").Booking[];
            reviews: import("../entities/Review").Review[];
            createdAt: Date;
            updatedAt: Date;
        };
        token: string;
    }>;
    getProfile(userId: string): Promise<{
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
        properties: import("../entities/Property").Property[];
        bookings: import("../entities/Booking").Booking[];
        reviews: import("../entities/Review").Review[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, updateData: Partial<User>): Promise<{
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
        properties: import("../entities/Property").Property[];
        bookings: import("../entities/Booking").Booking[];
        reviews: import("../entities/Review").Review[];
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export {};
//# sourceMappingURL=authServices.d.ts.map