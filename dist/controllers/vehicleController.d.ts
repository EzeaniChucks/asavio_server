import { Request, Response, NextFunction } from "express";
export declare const vehicleController: {
    getAvailableVehicleTypes: (req: Request, res: Response, next: NextFunction) => void;
    getVehicleTypeRepresentatives: (req: Request, res: Response, next: NextFunction) => void;
    listVehicles: (req: Request, res: Response, next: NextFunction) => void;
    getVehicle: (req: Request, res: Response, next: NextFunction) => void;
    createVehicle: (req: Request, res: Response, next: NextFunction) => void;
    updateVehicle: (req: Request, res: Response, next: NextFunction) => void;
    deleteVehicle: (req: Request, res: Response, next: NextFunction) => void;
    toggleAvailability: (req: Request, res: Response, next: NextFunction) => void;
    getMyVehicles: (req: Request, res: Response, next: NextFunction) => void;
    /** GET /api/vehicles/:id/booked-dates — booked + blocked ranges for calendar display */
    getBookedDates: (req: Request, res: Response, next: NextFunction) => void;
    /** PATCH /api/vehicles/:id/blocked-dates — host/admin sets manual unavailability */
    updateBlockedDates: (req: Request, res: Response, next: NextFunction) => void;
    /** POST /api/vehicles/:id/feature-video — upload a feature video (Pro/Elite) */
    uploadFeatureVideo: (req: Request, res: Response, next: NextFunction) => void;
    /** DELETE /api/vehicles/:id/feature-video — remove the feature video */
    deleteFeatureVideo: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=vehicleController.d.ts.map