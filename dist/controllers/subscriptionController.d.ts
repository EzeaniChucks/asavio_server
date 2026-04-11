import { Request, Response } from "express";
export declare const subscriptionController: {
    /** GET /api/subscriptions/me — returns the host's current subscription + tier config */
    getMySubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** POST /api/subscriptions/initiate — starts Paystack checkout for a plan */
    initiateSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * POST /api/subscriptions/verify
     * Called by the frontend after Paystack's callback redirect.
     * Verifies the payment with Paystack and activates the subscription if the
     * webhook hasn't already done so. Safe to call multiple times (idempotent).
     */
    verifySubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** DELETE /api/subscriptions/cancel — cancels the active subscription */
    cancelSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /api/subscriptions/tiers — public, returns tier config for UI */
    getTierConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /api/subscriptions/admin — paginated list of all subscriptions */
    adminListSubscriptions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /api/subscriptions/admin/stats */
    adminGetStats: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** DELETE /api/subscriptions/admin/:id — force-cancel any subscription */
    adminCancelSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /api/subscriptions/admin/tier-config — current active tier config (DB + defaults) */
    adminGetTierConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /**
     * PATCH /api/subscriptions/admin/tier-config/:tier
     * Updates prices/limits for a tier in the DB and syncs prices to Paystack.
     * Accepts: priceMonthly, priceAnnual, maxProperties, maxVehicles, maxPhotos, commissionRate
     */
    adminUpdateTierConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=subscriptionController.d.ts.map