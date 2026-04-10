// src/routers/bookingRouter.ts
import { Router } from "express";
import { bookingController } from "../controllers/bookingController";
import { protect, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { bookingValidation } from "../validations/bookingValidation";

const router = Router();

// All booking routes require authentication
router.use(protect);

// Availability check (no auth required — public query)
// Override: unauthenticated check lives on property router; here we keep it auth-aware
router.get("/availability", bookingController.checkAvailability);
router.get("/availability/vehicle", bookingController.checkVehicleAvailability);

// Guest routes
router.post("/", validate(bookingValidation.create), bookingController.createBooking);
router.get("/my", bookingController.getMyBookings);

// Host routes
router.get("/host", restrictTo("host", "admin"), bookingController.getHostBookings);

// Single booking (guest/host/admin)
router.get("/:id", bookingController.getBooking);

// Cancellation refund estimate — shown to user before they confirm cancel
router.get("/:id/cancellation-estimate", bookingController.getCancellationEstimate);

// Status update (host/admin confirm or complete; cancel handled by service logic for guest too)
router.patch(
  "/:id/status",
  validate(bookingValidation.updateStatus),
  bookingController.updateBookingStatus
);

export default router;
