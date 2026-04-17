"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/eventBookingRouter.ts
const express_1 = require("express");
const eventBookingController_1 = require("../controllers/eventBookingController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const eventCenterValidation_1 = require("../validations/eventCenterValidation");
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
// All routes require auth
router.use(auth_1.protect);
// Availability (booked slots for a space on a date)
router.get("/slots", eventBookingController_1.eventBookingController.getSlots);
// Guest: create event booking
router.post("/", (0, validation_1.validate)(eventCenterValidation_1.eventCenterValidation.createBooking), eventBookingController_1.eventBookingController.create);
// Guest: my event bookings
router.get("/my", eventBookingController_1.eventBookingController.getMyBookings);
// Host: event bookings for my venues
router.get("/host", (0, auth_1.restrictTo)("host", "admin"), eventBookingController_1.eventBookingController.getHostBookings);
// Single booking
router.get("/:id", eventBookingController_1.eventBookingController.getBooking);
// Status update
router.patch("/:id/status", (0, validation_1.validate)([
    (0, express_validator_1.param)("id").isUUID(),
    (0, express_validator_1.body)("status").isIn(["confirmed", "cancelled", "completed"]),
]), eventBookingController_1.eventBookingController.updateStatus);
exports.default = router;
//# sourceMappingURL=eventBookingRouter.js.map