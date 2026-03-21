import { User } from "../entities/User";
export declare const ACCEPTED_DOCUMENT_TYPES: readonly ["national_id", "voters_card", "drivers_license", "international_passport", "nin_slip"];
export type KycDocumentType = typeof ACCEPTED_DOCUMENT_TYPES[number];
export declare const DOCUMENT_TYPE_LABELS: Record<KycDocumentType, string>;
export declare const kycService: {
    submitKyc(userId: string, documentType: KycDocumentType, file: Express.Multer.File): Promise<{
        kycStatus: "pending";
    }>;
    getKycStatus(userId: string): Promise<{
        kycStatus: "pending" | "approved" | "rejected" | "not_submitted";
        kycDocumentType: string;
        kycSubmittedAt: Date | null;
        kycReviewedAt: Date | null;
        kycRejectionReason: string;
    }>;
    reviewKyc(userId: string, decision: "approved" | "rejected", rejectionReason?: string): Promise<{
        kycStatus: "approved" | "rejected";
    }>;
    getPendingKyc(): Promise<User[]>;
    getAllKyc(): Promise<User[]>;
};
//# sourceMappingURL=kycService.d.ts.map