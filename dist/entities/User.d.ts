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
    /** Optional per-host commission rate override (0–1). Null = use global rate. */
    commissionRateOverride: number | null;
    kycStatus: "not_submitted" | "pending" | "approved" | "rejected";
    kycDocumentType: string;
    kycDocumentUrl: string;
    kycDocumentPublicId: string;
    kycSubmittedAt: Date | null;
    kycReviewedAt: Date | null;
    kycRejectionReason: string;
    /**
     * Computed host tier badge. Recalculated after reviews and chat replies.
     * new_host → trusted_host → top_host
     */
    hostTier: "new_host" | "trusted_host" | "top_host";
    /** % of guest-initiated conversations where host replied within 24 h (0–1) */
    responseRate: number;
    /** Set on Socket.io disconnect — used for "Last seen X ago" display */
    lastSeen: Date | null;
    passwordResetToken: string;
    passwordResetExpires: Date | null;
    properties: Property[];
    bookings: Booking[];
    reviews: Review[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=User.d.ts.map