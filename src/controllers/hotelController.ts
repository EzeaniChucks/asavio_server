// src/controllers/hotelController.ts
import { Request, Response, NextFunction } from "express";
import { hotelService } from "../services/hotelService";
import { settingsService } from "../services/settingsService";
import { BookingService } from "../services/bookingService";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";

const bookingService = new BookingService();

export const hotelController = {
  // ── Public ──────────────────────────────────────────────────────────

  getAvailableHotelTypes: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const types = await hotelService.getAvailableHotelTypes();
    res.json({ status: "success", data: { types } });
  }),

  getHotelTypeRepresentatives: catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const hotels = await hotelService.getHotelTypeRepresentatives();
    res.json({ status: "success", data: { hotels } });
  }),

  listHotels: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { city, hotelType, star, minPrice, maxPrice, guests, sort, page, limit } = req.query;
    const result = await hotelService.getHotels({
      city: city as string,
      hotelType: hotelType as string,
      star: star ? Number(star) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      guests: guests ? Number(guests) : undefined,
      sort: sort as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });
    res.json({ status: "success", data: result });
  }),

  getHotel: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const hotel = await hotelService.getHotelById(req.params.id as string);
    res.json({ status: "success", data: { hotel } });
  }),

  /** GET /hotels/:id/rooms/:roomId/booked-dates — per-room booked ranges for calendar */
  getRoomBookedDates: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const bookedDates = await bookingService.getHotelRoomBookedDates(req.params.roomId as string);
    res.json({ status: "success", data: { bookedDates } });
  }),

  /** GET /hotels/:id/room-availability?checkIn=&checkOut= */
  getRoomAvailability: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      throw new AppError("checkIn and checkOut are required", 400);
    }
    const rooms = await hotelService.getRoomAvailability(
      req.params.id as string,
      checkIn as string,
      checkOut as string
    );
    res.json({ status: "success", data: { rooms } });
  }),

  // ── Host/Admin: hotel CRUD ──────────────────────────────────────────

  createHotel: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    // Enforce photo limit per tier
    if (files.length > 0) {
      const tier = req.user!.subscriptionTier ?? "starter";
      const tierConfig = await settingsService.getActiveTierConfig();
      const { maxPhotos, label } = tierConfig[tier];
      if (files.length > maxPhotos) {
        throw new AppError(
          `Your ${label} plan allows up to ${maxPhotos} photos per listing.`,
          400
        );
      }
    }

    // Parse JSON fields from multipart body
    const body = { ...req.body };
    if (typeof body.location === "string") body.location = JSON.parse(body.location);
    if (typeof body.amenities === "string") body.amenities = JSON.parse(body.amenities);
    if (typeof body.nearbyPlaces === "string") body.nearbyPlaces = JSON.parse(body.nearbyPlaces);

    const hotel = await hotelService.createHotel(req.user!.id, body, files);
    res.status(201).json({ status: "success", data: { hotel } });
  }),

  updateHotel: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    // Parse JSON fields
    const body = { ...req.body };
    if (typeof body.location === "string") body.location = JSON.parse(body.location);
    if (typeof body.amenities === "string") body.amenities = JSON.parse(body.amenities);
    if (typeof body.nearbyPlaces === "string") body.nearbyPlaces = JSON.parse(body.nearbyPlaces);

    const hotel = await hotelService.updateHotel(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      body,
      files.length ? files : undefined
    );
    res.json({ status: "success", data: { hotel } });
  }),

  deleteHotel: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await hotelService.deleteHotel(req.params.id as string, req.user!.id, req.user!.role);
    res.status(204).send();
  }),

  toggleAvailability: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const hotel = await hotelService.toggleAvailability(req.params.id as string, req.user!.id);
    res.json({ status: "success", data: { hotel } });
  }),

  getMyHotels: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const hotels = await hotelService.getHostHotels(req.user!.id);
    res.json({ status: "success", data: { hotels } });
  }),

  // ── Host/Admin: room type CRUD ──────────────────────────────────────

  createRoomType: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    const body = { ...req.body };
    if (typeof body.roomAmenities === "string") body.roomAmenities = JSON.parse(body.roomAmenities);

    const room = await hotelService.createRoomType(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      body,
      files
    );
    res.status(201).json({ status: "success", data: { room } });
  }),

  updateRoomType: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const files = (req.files as Express.Multer.File[]) ?? [];

    const body = { ...req.body };
    if (typeof body.roomAmenities === "string") body.roomAmenities = JSON.parse(body.roomAmenities);

    const room = await hotelService.updateRoomType(
      req.params.roomId as string,
      req.user!.id,
      req.user!.role,
      body,
      files.length ? files : undefined
    );
    res.json({ status: "success", data: { room } });
  }),

  deleteRoomType: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await hotelService.deleteRoomType(
      req.params.roomId as string,
      req.user!.id,
      req.user!.role
    );
    res.status(204).send();
  }),
};
