// src/validations/hotelValidation.ts
import { body } from "express-validator";

export const hotelValidation = {
  create: [
    body("name").trim().isLength({ min: 3, max: 200 }).withMessage("Name must be 3–200 characters"),
    body("description").trim().isLength({ min: 30 }).withMessage("Description must be at least 30 characters"),
    body("hotelType").optional().trim(),
    body("starRating").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage("Star rating must be 1–5"),
    body("checkInTime").optional().matches(/^\d{2}:\d{2}$/).withMessage("checkInTime must be HH:MM"),
    body("checkOutTime").optional().matches(/^\d{2}:\d{2}$/).withMessage("checkOutTime must be HH:MM"),
    body("cancellationPolicy")
      .optional()
      .isIn(["flexible", "moderate", "firm", "strict"])
      .withMessage("Invalid cancellation policy"),
  ],

  update: [
    body("name").optional().trim().isLength({ min: 3, max: 200 }),
    body("description").optional().trim().isLength({ min: 30 }),
    body("hotelType").optional().trim(),
    body("starRating").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }),
    body("checkInTime").optional().matches(/^\d{2}:\d{2}$/),
    body("checkOutTime").optional().matches(/^\d{2}:\d{2}$/),
    body("cancellationPolicy")
      .optional()
      .isIn(["flexible", "moderate", "firm", "strict"]),
    body("isAvailable").optional().isBoolean(),
  ],

  createRoomType: [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Room name required"),
    body("pricePerNight").isFloat({ min: 1 }).withMessage("Price must be positive"),
    body("maxGuests").isInt({ min: 1, max: 20 }).withMessage("Max guests must be 1–20"),
    body("totalUnits").optional().isInt({ min: 1, max: 500 }).withMessage("Total units must be 1–500"),
    body("bedType").optional().trim(),
    body("roomSize").optional().trim(),
  ],

  updateRoomType: [
    body("name").optional().trim().isLength({ min: 2, max: 100 }),
    body("pricePerNight").optional().isFloat({ min: 1 }),
    body("maxGuests").optional().isInt({ min: 1, max: 20 }),
    body("totalUnits").optional().isInt({ min: 1, max: 500 }),
    body("bedType").optional().trim(),
    body("roomSize").optional().trim(),
  ],
};
