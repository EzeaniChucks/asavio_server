// src/controllers/eventBookingController.ts
import { Request, Response, NextFunction } from "express";
import { eventBookingService } from "../services/eventBookingService";
import { catchAsync } from "../utils/catchAsync";

export const eventBookingController = {
  /** GET /event-bookings/slots?eventSpaceId=&eventDate= */
  getSlots: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { eventSpaceId, eventDate } = req.query;
    const slots = await eventBookingService.getSlots(
      eventSpaceId as string,
      eventDate as string
    );
    res.json({ status: "success", data: { slots } });
  }),

  /** POST /event-bookings */
  create: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const booking = await eventBookingService.createBooking(req.user!.id, req.body);
    res.status(201).json({ status: "success", data: { booking } });
  }),

  /** GET /event-bookings/my */
  getMyBookings: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const bookings = await eventBookingService.getUserBookings(req.user!.id);
    res.json({ status: "success", data: { bookings } });
  }),

  /** GET /event-bookings/host */
  getHostBookings: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const bookings = await eventBookingService.getHostBookings(req.user!.id);
    res.json({ status: "success", data: { bookings } });
  }),

  /** GET /event-bookings/:id */
  getBooking: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const booking = await eventBookingService.getById(
      req.params.id as string,
      req.user!.id,
      req.user!.role
    );
    res.json({ status: "success", data: { booking } });
  }),

  /** PATCH /event-bookings/:id/status */
  updateStatus: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const booking = await eventBookingService.updateStatus(
      req.params.id as string,
      req.body.status,
      req.user!.id,
      req.user!.role,
      req.body.cancellationReason
    );
    res.json({ status: "success", data: { booking } });
  }),
};
