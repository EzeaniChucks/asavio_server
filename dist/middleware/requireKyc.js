"use strict";
// src/middleware/requireKyc.ts
// Blocks listing creation (property, vehicle, hotel, event center) unless the
// host has submitted KYC. Rejected and not-submitted are both blocked.
// Admins bypass the check.
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireKyc = void 0;
const AppError_1 = require("../utils/AppError");
const requireKyc = (req, _res, next) => {
    const user = req.user;
    if (!user)
        return next(new AppError_1.AppError("Not authenticated.", 401));
    // Admins never need KYC
    if (user.role === "admin")
        return next();
    const status = user.kycStatus ?? "not_submitted";
    if (status === "not_submitted") {
        return next(new AppError_1.AppError("Please submit your identity verification (KYC) before creating a listing. Go to Account Settings → KYC to upload your documents.", 403));
    }
    if (status === "rejected") {
        return next(new AppError_1.AppError("Your KYC was rejected. Please resubmit your documents in Account Settings before creating a listing.", 403));
    }
    // "pending" or "approved" — allow
    next();
};
exports.requireKyc = requireKyc;
//# sourceMappingURL=requireKyc.js.map