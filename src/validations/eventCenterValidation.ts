// src/validations/eventCenterValidation.ts
import { body } from "express-validator";

export const eventCenterValidation = {
  create: [
    body("name").trim().isLength({ min: 3, max: 200 }).withMessage("Name must be 3–200 characters"),
    body("description").trim().isLength({ min: 30 }).withMessage("Description must be at least 30 characters"),
    body("cancellationPolicy")
      .optional()
      .isIn(["flexible", "moderate", "firm", "strict"])
      .withMessage("Invalid cancellation policy"),
  ],

  update: [
    body("name").optional().trim().isLength({ min: 3, max: 200 }),
    body("description").optional().trim().isLength({ min: 30 }),
    body("cancellationPolicy")
      .optional()
      .isIn(["flexible", "moderate", "firm", "strict"]),
    body("isAvailable").optional().isBoolean(),
  ],

  createSpace: [
    body("name").trim().isLength({ min: 2, max: 100 }).withMessage("Space name required"),
    body("capacity").isInt({ min: 1, max: 10000 }).withMessage("Capacity must be 1–10,000"),
    body("pricingMode")
      .isIn(["hourly", "daily", "package", "hybrid"])
      .withMessage("pricingMode must be hourly, daily, package, or hybrid"),
    body("hourlyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("minHours").optional().isInt({ min: 1, max: 24 }),
    body("dailyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("packageRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("packageHoursIncluded").optional({ checkFalsy: true }).isInt({ min: 1, max: 48 }),
    body("setupMinutes").optional().isInt({ min: 0, max: 480 }),
    body("teardownMinutes").optional().isInt({ min: 0, max: 480 }),
  ],

  updateSpace: [
    body("name").optional().trim().isLength({ min: 2, max: 100 }),
    body("capacity").optional().isInt({ min: 1, max: 10000 }),
    body("pricingMode").optional().isIn(["hourly", "daily", "package", "hybrid"]),
    body("hourlyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("minHours").optional().isInt({ min: 1, max: 24 }),
    body("dailyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("packageRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
    body("packageHoursIncluded").optional({ checkFalsy: true }).isInt({ min: 1, max: 48 }),
    body("setupMinutes").optional().isInt({ min: 0, max: 480 }),
    body("teardownMinutes").optional().isInt({ min: 0, max: 480 }),
  ],

  createBooking: [
    body("eventCenterId").isUUID().withMessage("Invalid event center ID"),
    body("eventSpaceId").isUUID().withMessage("Invalid event space ID"),
    body("eventDate").isISO8601().withMessage("eventDate must be YYYY-MM-DD"),
    body("startTime").matches(/^\d{2}:\d{2}$/).withMessage("startTime must be HH:MM"),
    body("endTime").matches(/^\d{2}:\d{2}$/).withMessage("endTime must be HH:MM"),
    body("eventType").trim().notEmpty().withMessage("Event type is required"),
    body("attendeeCount").isInt({ min: 1 }).withMessage("At least 1 attendee"),
    body("pricingUsed")
      .isIn(["hourly", "daily", "package"])
      .withMessage("pricingUsed must be hourly, daily, or package"),
    body("specialRequests").optional().trim().isLength({ max: 500 }),
  ],
};
