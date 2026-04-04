import { Request, Response } from "express";
export declare const hostProfileController: {
    /** GET /api/hosts/:id — public, no auth required */
    getPublicProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** PATCH /api/users/profile — authenticated host updates own profile */
    updateProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** POST /api/users/profile/photo — authenticated host uploads profile photo */
    uploadProfilePhoto: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=hostProfileController.d.ts.map