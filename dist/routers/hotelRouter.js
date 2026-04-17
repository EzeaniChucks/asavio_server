"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/hotelRouter.ts
const express_1 = require("express");
const hotelController_1 = require("../controllers/hotelController");
const auth_1 = require("../middleware/auth");
const requireKyc_1 = require("../middleware/requireKyc");
const upload_1 = require("../middleware/upload");
const validation_1 = require("../middleware/validation");
const hotelValidation_1 = require("../validations/hotelValidation");
const router = (0, express_1.Router)();
// ── Public ────────────────────────────────────────────────────────────
router.get("/types", hotelController_1.hotelController.getAvailableHotelTypes);
router.get("/type-representatives", hotelController_1.hotelController.getHotelTypeRepresentatives);
router.get("/", hotelController_1.hotelController.listHotels);
// Must come before /:id
router.get("/:id/room-availability", hotelController_1.hotelController.getRoomAvailability);
router.get("/:id/rooms/:roomId/booked-dates", hotelController_1.hotelController.getRoomBookedDates);
router.get("/:id", hotelController_1.hotelController.getHotel);
// ── Protected (auth required for all below) ───────────────────────────
router.use(auth_1.protect);
router.get("/host/my", (0, auth_1.restrictTo)("host", "admin"), hotelController_1.hotelController.getMyHotels);
// Create hotel (requires KYC)
router.post("/", (0, auth_1.restrictTo)("host", "admin"), requireKyc_1.requireKyc, upload_1.upload.array("images", 20), (0, validation_1.validate)(hotelValidation_1.hotelValidation.create), hotelController_1.hotelController.createHotel);
// Update hotel
router.patch("/:id", (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 20), (0, validation_1.validate)(hotelValidation_1.hotelValidation.update), hotelController_1.hotelController.updateHotel);
router.delete("/:id", (0, auth_1.restrictTo)("host", "admin"), hotelController_1.hotelController.deleteHotel);
router.patch("/:id/toggle-availability", (0, auth_1.restrictTo)("host", "admin"), hotelController_1.hotelController.toggleAvailability);
// Room types
router.post("/:id/rooms", (0, auth_1.restrictTo)("host", "admin"), requireKyc_1.requireKyc, upload_1.upload.array("images", 10), (0, validation_1.validate)(hotelValidation_1.hotelValidation.createRoomType), hotelController_1.hotelController.createRoomType);
router.patch("/:id/rooms/:roomId", (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 10), (0, validation_1.validate)(hotelValidation_1.hotelValidation.updateRoomType), hotelController_1.hotelController.updateRoomType);
router.delete("/:id/rooms/:roomId", (0, auth_1.restrictTo)("host", "admin"), hotelController_1.hotelController.deleteRoomType);
exports.default = router;
//# sourceMappingURL=hotelRouter.js.map