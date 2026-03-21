// src/controllers/bookingController.ts
import { Request, Response } from "express";
import { BookingService } from "../services/bookingService";
import { BookingStatus } from "../entities/Booking";
import { catchAsync } from "../utils/catchAsync";

const bookingService = new BookingService();

export const bookingController = {
  createBooking: catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.createBooking(req.user.id, req.body);

    res.status(201).json({
      status: "success",
      data: { booking },
    });
  }),

  getMyBookings: catchAsync(async (req: Request, res: Response) => {
    const bookings = await bookingService.getUserBookings(req.user.id);

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: { bookings },
    });
  }),

  getHostBookings: catchAsync(async (req: Request, res: Response) => {
    const bookings = await bookingService.getHostBookings(req.user.id);

    res.status(200).json({
      status: "success",
      results: bookings.length,
      data: { bookings },
    });
  }),

  getBooking: catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.getBookingById(
      req.params.id as string,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      status: "success",
      data: { booking },
    });
  }),

  updateBookingStatus: catchAsync(async (req: Request, res: Response) => {
    const booking = await bookingService.updateBookingStatus(
      req.params.id as string,
      req.body.status as BookingStatus,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      status: "success",
      data: { booking },
    });
  }),

  checkAvailability: catchAsync(async (req: Request, res: Response) => {
    const { propertyId, checkIn, checkOut, purpose } = req.query as Record<string, string>;
    const result = await bookingService.checkAvailability(propertyId, checkIn, checkOut, purpose);
    res.status(200).json({ status: "success", data: result });
  }),

  checkVehicleAvailability: catchAsync(async (req: Request, res: Response) => {
    const { vehicleId, checkIn, checkOut, withDriver } = req.query as Record<string, string>;
    const result = await bookingService.checkVehicleAvailability(
      vehicleId,
      checkIn,
      checkOut,
      withDriver === "true"
    );
    res.status(200).json({ status: "success", data: result });
  }),

  getVehicleBookedDates: catchAsync(async (req: Request, res: Response) => {
    const bookedDates = await bookingService.getVehicleBookedDates(req.params.vehicleId as string);
    res.json({ status: "success", data: { bookedDates } });
  }),
};
