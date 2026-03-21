"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/bookingRouter.ts
const express_1 = require("express");
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const bookingValidation_1 = require("../validations/bookingValidation");
const router = (0, express_1.Router)();
// All booking routes require authentication
router.use(auth_1.protect);
// Availability check (no auth required — public query)
// Override: unauthenticated check lives on property router; here we keep it auth-aware
router.get("/availability", bookingController_1.bookingController.checkAvailability);
router.get("/availability/vehicle", bookingController_1.bookingController.checkVehicleAvailability);
// Guest routes
router.post("/", (0, validation_1.validate)(bookingValidation_1.bookingValidation.create), bookingController_1.bookingController.createBooking);
router.get("/my", bookingController_1.bookingController.getMyBookings);
// Host routes
router.get("/host", (0, auth_1.restrictTo)("host", "admin"), bookingController_1.bookingController.getHostBookings);
// Single booking (guest/host/admin)
router.get("/:id", bookingController_1.bookingController.getBooking);
// Status update (host/admin confirm or complete; cancel handled by service logic for guest too)
router.patch("/:id/status", (0, validation_1.validate)(bookingValidation_1.bookingValidation.updateStatus), bookingController_1.bookingController.updateBookingStatus);
exports.default = router;
//# sourceMappingURL=bookingRouter.js.map