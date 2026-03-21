// src/controllers/kycController.ts
import { Request, Response, NextFunction } from "express";
import { kycService, ACCEPTED_DOCUMENT_TYPES, KycDocumentType } from "../services/kycService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

export const kycController = {
  // Host: submit KYC document
  submit: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const userId = (req as any).user.id;
    const { documentType } = req.body;
    const file = req.file;

    if (!file) return next(new AppError("Please upload a document image", 400));
    if (!documentType) return next(new AppError("Document type is required", 400));
    if (!ACCEPTED_DOCUMENT_TYPES.includes(documentType as KycDocumentType)) {
      return next(new AppError("Invalid document type", 400));
    }

    const result = await kycService.submitKyc(userId, documentType as KycDocumentType, file);
    res.json({ status: "success", data: result });
  }),

  // Host: get own KYC status
  getStatus: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = (req as any).user.id;
    const result = await kycService.getKycStatus(userId);
    res.json({ status: "success", data: result });
  }),

  // Admin: list all KYC submissions
  listAll: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const submissions = await kycService.getAllKyc();
    res.json({ status: "success", data: { submissions } });
  }),

  // Admin: approve or reject a KYC submission
  review: catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const { decision, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return next(new AppError("Decision must be 'approved' or 'rejected'", 400));
    }
    if (decision === "rejected" && !rejectionReason) {
      return next(new AppError("A rejection reason is required", 400));
    }

    const result = await kycService.reviewKyc(userId as string, decision, rejectionReason);
    res.json({ status: "success", data: result });
  }),
};
