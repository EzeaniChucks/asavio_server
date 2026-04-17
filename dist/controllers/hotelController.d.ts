import { Request, Response, NextFunction } from "express";
export declare const hotelController: {
    getAvailableHotelTypes: (req: Request, res: Response, next: NextFunction) => void;
    getHotelTypeRepresentatives: (req: Request, res: Response, next: NextFunction) => void;
    listHotels: (req: Request, res: Response, next: NextFunction) => void;
    getHotel: (req: Request, res: Response, next: NextFunction) => void;
    /** GET /hotels/:id/rooms/:roomId/booked-dates — per-room booked ranges for calendar */
    getRoomBookedDates: (req: Request, res: Response, next: NextFunction) => void;
    /** GET /hotels/:id/room-availability?checkIn=&checkOut= */
    getRoomAvailability: (req: Request, res: Response, next: NextFunction) => void;
    createHotel: (req: Request, res: Response, next: NextFunction) => void;
    updateHotel: (req: Request, res: Response, next: NextFunction) => void;
    deleteHotel: (req: Request, res: Response, next: NextFunction) => void;
    toggleAvailability: (req: Request, res: Response, next: NextFunction) => void;
    getMyHotels: (req: Request, res: Response, next: NextFunction) => void;
    createRoomType: (req: Request, res: Response, next: NextFunction) => void;
    updateRoomType: (req: Request, res: Response, next: NextFunction) => void;
    deleteRoomType: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=hotelController.d.ts.map