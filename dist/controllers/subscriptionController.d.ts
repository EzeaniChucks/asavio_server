import { Request, Response } from "express";
export declare const subscriptionController: {
    /** GET /api/subscriptions/me — returns the host's current subscription + tier config */
    getMySubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** POST /api/subscriptions/initiate — starts Paystack checkout for a plan */
    initiateSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** DELETE /api/subscriptions/cancel — cancels the active subscription */
    cancelSubscription: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /api/subscriptions/tiers — public, returns tier config for UI */
    getTierConfig: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=subscriptionController.d.ts.map