import { Request, Response, NextFunction } from "express";
export declare const eventCenterController: {
    listEventCenters: (req: Request, res: Response, next: NextFunction) => void;
    getEventCenter: (req: Request, res: Response, next: NextFunction) => void;
    createEventCenter: (req: Request, res: Response, next: NextFunction) => void;
    updateEventCenter: (req: Request, res: Response, next: NextFunction) => void;
    deleteEventCenter: (req: Request, res: Response, next: NextFunction) => void;
    toggleAvailability: (req: Request, res: Response, next: NextFunction) => void;
    getMyEventCenters: (req: Request, res: Response, next: NextFunction) => void;
    createSpace: (req: Request, res: Response, next: NextFunction) => void;
    updateSpace: (req: Request, res: Response, next: NextFunction) => void;
    deleteSpace: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=eventCenterController.d.ts.map