import { Request, Response, NextFunction } from "express";
export declare const adminController: {
    getStats: (req: Request, res: Response, next: NextFunction) => void;
    getUsers: (req: Request, res: Response, next: NextFunction) => void;
    updateUser: (req: Request, res: Response, next: NextFunction) => void;
    deleteUser: (req: Request, res: Response, next: NextFunction) => void;
    getProperties: (req: Request, res: Response, next: NextFunction) => void;
    updateProperty: (req: Request, res: Response, next: NextFunction) => void;
    deleteProperty: (req: Request, res: Response, next: NextFunction) => void;
    getVehicles: (req: Request, res: Response, next: NextFunction) => void;
    deleteVehicle: (req: Request, res: Response, next: NextFunction) => void;
    getBookings: (req: Request, res: Response, next: NextFunction) => void;
    updateBookingStatus: (req: Request, res: Response, next: NextFunction) => void;
    deleteReview: (req: Request, res: Response, next: NextFunction) => void;
    sendBroadcast: (req: Request, res: Response, next: NextFunction) => void;
    previewAudienceCount: (req: Request, res: Response, next: NextFunction) => void;
    getSettings: (req: Request, res: Response, next: NextFunction) => void;
    updateSettings: (req: Request, res: Response, next: NextFunction) => void;
    getHostProperties: (req: Request, res: Response, next: NextFunction) => void;
    setHostCommissionRate: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=adminController.d.ts.map