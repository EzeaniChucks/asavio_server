import { Request, Response, NextFunction } from "express";
export declare const vehicleController: {
    listVehicles: (req: Request, res: Response, next: NextFunction) => void;
    getVehicle: (req: Request, res: Response, next: NextFunction) => void;
    createVehicle: (req: Request, res: Response, next: NextFunction) => void;
    updateVehicle: (req: Request, res: Response, next: NextFunction) => void;
    deleteVehicle: (req: Request, res: Response, next: NextFunction) => void;
    toggleAvailability: (req: Request, res: Response, next: NextFunction) => void;
    getMyVehicles: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=vehicleController.d.ts.map