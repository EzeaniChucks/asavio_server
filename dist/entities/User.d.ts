import { Property } from "./Property";
import { Booking } from "./Booking";
import { Review } from "./Review";
export declare class User {
    id: string;
    email: string;
    password: string;
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
    properties: Property[];
    bookings: Booking[];
    reviews: Review[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=User.d.ts.map