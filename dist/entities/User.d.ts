import { Property } from "./Property";
import { Booking } from "./Booking";
import { Review } from "./Review";
import { SubscriptionTier } from "../constants/subscriptionTiers";
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
    /**
     * Paid subscription tier. Denormalised from the Subscription table for
     * fast reads in middleware and commission calculations.
     * Defaults to 'starter' (free tier).
     */
    subscriptionTier: SubscriptionTier;
    /** % of guest-initiated conversations where host replied within 24 h (0–1) */
    responseRate: number;
    /** Short bio shown on public host profile */
    bio: string | null;
    /** Languages the host speaks — e.g. ["English", "Yoruba"] */
    languages: string[] | null;
    /** Host's occupation / job title */
    occupation: string | null;
    /** City/area where the host is based */
    city: string | null;
    /** Why the host chose to host — shown on public profile */
    whyIHost: string | null;
    /** School / university attended */
    school: string | null;
    /** Cloudinary public_id for the profile image — for deletion */
    profileImagePublicId: string | null;
    /** Set on Socket.io disconnect — used for "Last seen X ago" display */
    lastSeen: Date | null;
    passwordResetToken: string;
    passwordResetExpires: Date | null;
    isEmailVerified: boolean;
    emailVerificationToken: string;
    emailVerificationExpires: Date | null;
    /** true = platform owner; bypasses all permission checks */
    isSuperAdmin: boolean;
    /**
     * Granted permissions for sub-admins.
     * null  → super-admin (all permissions).
     * []    → admin with no permissions yet.
     */
    adminPermissions: string[] | null;
    properties: Property[];
    bookings: Booking[];
    reviews: Review[];
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=User.d.ts.map