import { Request, Response } from "express";
export declare const bookingController: {
    createBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMyBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getHostBookings: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getBooking: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateBookingStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    checkAvailability: (req: Request, res: Response, next: import("express").NextFunction) => void;
    checkVehicleAvailability: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getVehicleBookedDates: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=bookingController.d.ts.map