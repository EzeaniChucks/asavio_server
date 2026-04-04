// src/services/kycService.ts
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { CloudinaryService } from "./cloudinaryService";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";
import { AppError } from "../utils/AppError";

const cloudinaryService = new CloudinaryService();

export const ACCEPTED_DOCUMENT_TYPES = [
  "national_id",
  "voters_card",
  "drivers_license",
  "international_passport",
  "nin_slip",
] as const;

export type KycDocumentType = typeof ACCEPTED_DOCUMENT_TYPES[number];

export const DOCUMENT_TYPE_LABELS: Record<KycDocumentType, string> = {
  national_id: "National ID Card",
  voters_card: "Voter's Card",
  drivers_license: "Driver's License",
  international_passport: "International Passport",
  nin_slip: "NIN Slip",
};

export const kycService = {
  async submitKyc(
    userId: string,
    documentType: KycDocumentType,
    file: Express.Multer.File
  ) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    if (user.kycStatus === "approved") {
      throw new AppError("Your identity is already verified", 400);
    }

    if (!ACCEPTED_DOCUMENT_TYPES.includes(documentType)) {
      throw new AppError("Invalid document type", 400);
    }

    // Delete old document from Cloudinary if re-submitting
    if (user.kycDocumentPublicId) {
      try {
        await cloudinaryService.deleteImage(user.kycDocumentPublicId);
      } catch {
        // Non-fatal — continue
      }
    }

    const uploaded = await cloudinaryService.uploadImage(file, "kyc");

    user.kycStatus = "pending";
    user.kycDocumentType = documentType;
    user.kycDocumentUrl = uploaded.url;
    user.kycDocumentPublicId = uploaded.publicId;
    user.kycSubmittedAt = new Date();
    user.kycRejectionReason = null!;

    await userRepo.save(user);

    // Notify admin — best-effort
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      emailService.sendKycSubmitted({
        to: adminEmail,
        hostName: `${user.firstName} ${user.lastName}`,
        hostEmail: user.email,
        documentType: DOCUMENT_TYPE_LABELS[documentType],
        userId: user.id,
      }).catch(console.error);
    }

    // In-app notification to all admins
    notificationService.sendToAllAdmins({
      type: "kyc_submitted",
      title: "New KYC submission",
      body: `${user.firstName} ${user.lastName} has submitted their identity documents for verification.`,
      data: { url: "/dashboard/admin/kyc", urlLabel: "Review KYC" },
    }).catch(console.error);

    return { kycStatus: user.kycStatus };
  },

  async getKycStatus(userId: string) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    return {
      kycStatus: user.kycStatus,
      kycDocumentType: user.kycDocumentType ?? null,
      kycSubmittedAt: user.kycSubmittedAt ?? null,
      kycReviewedAt: user.kycReviewedAt ?? null,
      kycRejectionReason: user.kycRejectionReason ?? null,
    };
  },

  async reviewKyc(
    userId: string,
    decision: "approved" | "rejected",
    rejectionReason?: string
  ) {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    if (user.kycStatus !== "pending") {
      throw new AppError("This KYC submission is not pending review", 400);
    }

    user.kycStatus = decision;
    user.kycReviewedAt = new Date();
    user.isVerified = decision === "approved";
    if (decision === "rejected" && rejectionReason) {
      user.kycRejectionReason = rejectionReason;
    }

    await userRepo.save(user);

    // In-app notification to host
    notificationService.send({
      userId: user.id,
      type: decision === "approved" ? "kyc_approved" : "kyc_rejected",
      title: decision === "approved" ? "Identity verified ✓" : "Identity verification failed",
      body: decision === "approved"
        ? "Your identity has been verified. You can now list properties and receive payouts."
        : `Your KYC submission was rejected${rejectionReason ? `: ${rejectionReason}` : "."}`,
      data: { url: "/dashboard/host/kyc", urlLabel: "View status" },
    }).catch(console.error);

    // Notify host — best-effort, never block the review succeeding
    emailService.sendKycReviewed({
      to: user.email,
      hostName: user.firstName,
      decision,
      rejectionReason,
    }).catch(console.error);

    return { kycStatus: user.kycStatus };
  },

  async getPendingKyc() {
    const userRepo = AppDataSource.getRepository(User);
    return userRepo.find({
      where: { kycStatus: "pending" },
      select: [
        "id",
        "firstName",
        "lastName",
        "email",
        "kycStatus",
        "kycDocumentType",
        "kycDocumentUrl",
        "kycSubmittedAt",
      ],
      order: { kycSubmittedAt: "ASC" },
    });
  },

  async getAllKyc() {
    const userRepo = AppDataSource.getRepository(User);
    return userRepo.find({
      where: [
        { kycStatus: "pending" },
        { kycStatus: "approved" },
        { kycStatus: "rejected" },
      ],
      select: [
        "id",
        "firstName",
        "lastName",
        "email",
        "kycStatus",
        "kycDocumentType",
        "kycDocumentUrl",
        "kycSubmittedAt",
        "kycReviewedAt",
        "kycRejectionReason",
      ],
      order: { kycSubmittedAt: "DESC" },
    });
  },
};
