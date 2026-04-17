import { Request, Response, NextFunction } from "express";
export declare const eventBookingController: {
    /** GET /event-bookings/slots?eventSpaceId=&eventDate= */
    getSlots: (req: Request, res: Response, next: NextFunction) => void;
    /** POST /event-bookings */
    create: (req: Request, res: Response, next: NextFunction) => void;
    /** GET /event-bookings/my */
    getMyBookings: (req: Request, res: Response, next: NextFunction) => void;
    /** GET /event-bookings/host */
    getHostBookings: (req: Request, res: Response, next: NextFunction) => void;
    /** GET /event-bookings/:id */
    getBooking: (req: Request, res: Response, next: NextFunction) => void;
    /** PATCH /event-bookings/:id/status */
    updateStatus: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=eventBookingController.d.ts.map