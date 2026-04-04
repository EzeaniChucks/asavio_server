import { Request, Response } from "express";
export declare const propertyController: {
    createProperty: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getProperty: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAllProperties: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getHomeSections: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyProperties: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getAvailablePropertyTypes: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getTypeRepresentatives: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /api/properties/analytics — host's analytics (Pro/Elite) */
    getAnalytics: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateProperty: (req: Request, res: Response, next: import("express").NextFunction) => void;
    deleteProperty: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getBookedDates: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateBlockedDates: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** POST /api/properties/:id/feature-video — upload a feature video (Pro/Elite) */
    uploadFeatureVideo: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** DELETE /api/properties/:id/feature-video — remove the feature video */
    deleteFeatureVideo: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=propertyController.d.ts.map