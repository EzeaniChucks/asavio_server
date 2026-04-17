// src/routers/eventBookingRouter.ts
import { Router } from "express";
import { eventBookingController } from "../controllers/eventBookingController";
import { protect, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { eventCenterValidation } from "../validations/eventCenterValidation";
import { body, param } from "express-validator";

const router = Router();

// All routes require auth
router.use(protect);

// Availability (booked slots for a space on a date)
router.get("/slots", eventBookingController.getSlots);

// Guest: create event booking
router.post(
  "/",
  validate(eventCenterValidation.createBooking),
  eventBookingController.create
);

// Guest: my event bookings
router.get("/my", eventBookingController.getMyBookings);

// Host: event bookings for my venues
router.get("/host", restrictTo("host", "admin"), eventBookingController.getHostBookings);

// Single booking
router.get("/:id", eventBookingController.getBooking);

// Status update
router.patch(
  "/:id/status",
  validate([
    param("id").isUUID(),
    body("status").isIn(["confirmed", "cancelled", "completed"]),
  ]),
  eventBookingController.updateStatus
);

export default router;
