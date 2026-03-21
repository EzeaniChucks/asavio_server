"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycController = void 0;
const kycService_1 = require("../services/kycService");
const catchAsync_1 = require("../utils/catchAsync");
const AppError_1 = require("../utils/AppError");
exports.kycController = {
    // Host: submit KYC document
    submit: (0, catchAsync_1.catchAsync)(async (req, res, next) => {
        const userId = req.user.id;
        const { documentType } = req.body;
        const file = req.file;
        if (!file)
            return next(new AppError_1.AppError("Please upload a document image", 400));
        if (!documentType)
            return next(new AppError_1.AppError("Document type is required", 400));
        if (!kycService_1.ACCEPTED_DOCUMENT_TYPES.includes(documentType)) {
            return next(new AppError_1.AppError("Invalid document type", 400));
        }
        const result = await kycService_1.kycService.submitKyc(userId, documentType, file);
        res.json({ status: "success", data: result });
    }),
    // Host: get own KYC status
    getStatus: (0, catchAsync_1.catchAsync)(async (req, res, _next) => {
        const userId = req.user.id;
        const result = await kycService_1.kycService.getKycStatus(userId);
        res.json({ status: "success", data: result });
    }),
    // Admin: list all KYC submissions
    listAll: (0, catchAsync_1.catchAsync)(async (_req, res, _next) => {
        const submissions = await kycService_1.kycService.getAllKyc();
        res.json({ status: "success", data: { submissions } });
    }),
    // Admin: approve or reject a KYC submission
    review: (0, catchAsync_1.catchAsync)(async (req, res, next) => {
        const { userId } = req.params;
        const { decision, rejectionReason } = req.body;
        if (!["approved", "rejected"].includes(decision)) {
            return next(new AppError_1.AppError("Decision must be 'approved' or 'rejected'", 400));
        }
        if (decision === "rejected" && !rejectionReason) {
            return next(new AppError_1.AppError("A rejection reason is required", 400));
        }
        const result = await kycService_1.kycService.reviewKyc(userId, decision, rejectionReason);
        res.json({ status: "success", data: result });
    }),
};
//# sourceMappingURL=kycController.js.map