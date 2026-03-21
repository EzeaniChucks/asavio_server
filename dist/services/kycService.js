"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycService = exports.DOCUMENT_TYPE_LABELS = exports.ACCEPTED_DOCUMENT_TYPES = void 0;
// src/services/kycService.ts
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const cloudinaryService_1 = require("./cloudinaryService");
const emailService_1 = require("./emailService");
const AppError_1 = require("../utils/AppError");
const cloudinaryService = new cloudinaryService_1.CloudinaryService();
exports.ACCEPTED_DOCUMENT_TYPES = [
    "national_id",
    "voters_card",
    "drivers_license",
    "international_passport",
    "nin_slip",
];
exports.DOCUMENT_TYPE_LABELS = {
    national_id: "National ID Card",
    voters_card: "Voter's Card",
    drivers_license: "Driver's License",
    international_passport: "International Passport",
    nin_slip: "NIN Slip",
};
exports.kycService = {
    async submitKyc(userId, documentType, file) {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        if (user.kycStatus === "approved") {
            throw new AppError_1.AppError("Your identity is already verified", 400);
        }
        if (!exports.ACCEPTED_DOCUMENT_TYPES.includes(documentType)) {
            throw new AppError_1.AppError("Invalid document type", 400);
        }
        // Delete old document from Cloudinary if re-submitting
        if (user.kycDocumentPublicId) {
            try {
                await cloudinaryService.deleteImage(user.kycDocumentPublicId);
            }
            catch {
                // Non-fatal — continue
            }
        }
        const uploaded = await cloudinaryService.uploadImage(file, "kyc");
        user.kycStatus = "pending";
        user.kycDocumentType = documentType;
        user.kycDocumentUrl = uploaded.url;
        user.kycDocumentPublicId = uploaded.publicId;
        user.kycSubmittedAt = new Date();
        user.kycRejectionReason = null;
        await userRepo.save(user);
        // Notify admin
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            await emailService_1.emailService.sendKycSubmitted({
                to: adminEmail,
                hostName: `${user.firstName} ${user.lastName}`,
                hostEmail: user.email,
                documentType: exports.DOCUMENT_TYPE_LABELS[documentType],
                userId: user.id,
            });
        }
        return { kycStatus: user.kycStatus };
    },
    async getKycStatus(userId) {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        return {
            kycStatus: user.kycStatus,
            kycDocumentType: user.kycDocumentType ?? null,
            kycSubmittedAt: user.kycSubmittedAt ?? null,
            kycReviewedAt: user.kycReviewedAt ?? null,
            kycRejectionReason: user.kycRejectionReason ?? null,
        };
    },
    async reviewKyc(userId, decision, rejectionReason) {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        if (user.kycStatus !== "pending") {
            throw new AppError_1.AppError("This KYC submission is not pending review", 400);
        }
        user.kycStatus = decision;
        user.kycReviewedAt = new Date();
        if (decision === "rejected" && rejectionReason) {
            user.kycRejectionReason = rejectionReason;
        }
        await userRepo.save(user);
        // Notify host
        await emailService_1.emailService.sendKycReviewed({
            to: user.email,
            hostName: user.firstName,
            decision,
            rejectionReason,
        });
        return { kycStatus: user.kycStatus };
    },
    async getPendingKyc() {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
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
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
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
//# sourceMappingURL=kycService.js.map