// src/routers/hotelRouter.ts
import { Router } from "express";
import { hotelController } from "../controllers/hotelController";
import { protect, restrictTo } from "../middleware/auth";
import { requireKyc } from "../middleware/requireKyc";
import { upload } from "../middleware/upload";
import { validate } from "../middleware/validation";
import { hotelValidation } from "../validations/hotelValidation";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────

router.get("/types", hotelController.getAvailableHotelTypes);
router.get("/type-representatives", hotelController.getHotelTypeRepresentatives);
router.get("/", hotelController.listHotels);

// Must come before /:id
router.get("/:id/room-availability", hotelController.getRoomAvailability);
router.get("/:id/rooms/:roomId/booked-dates", hotelController.getRoomBookedDates);

router.get("/:id", hotelController.getHotel);

// ── Protected (auth required for all below) ───────────────────────────

router.use(protect);

router.get("/host/my", restrictTo("host", "admin"), hotelController.getMyHotels);

// Create hotel (requires KYC)
router.post(
  "/",
  restrictTo("host", "admin"),
  requireKyc,
  upload.array("images", 20),
  validate(hotelValidation.create),
  hotelController.createHotel
);

// Update hotel
router.patch(
  "/:id",
  restrictTo("host", "admin"),
  upload.array("images", 20),
  validate(hotelValidation.update),
  hotelController.updateHotel
);

router.delete("/:id", restrictTo("host", "admin"), hotelController.deleteHotel);

router.patch(
  "/:id/toggle-availability",
  restrictTo("host", "admin"),
  hotelController.toggleAvailability
);

// Room types
router.post(
  "/:id/rooms",
  restrictTo("host", "admin"),
  requireKyc,
  upload.array("images", 10),
  validate(hotelValidation.createRoomType),
  hotelController.createRoomType
);

router.patch(
  "/:id/rooms/:roomId",
  restrictTo("host", "admin"),
  upload.array("images", 10),
  validate(hotelValidation.updateRoomType),
  hotelController.updateRoomType
);

router.delete(
  "/:id/rooms/:roomId",
  restrictTo("host", "admin"),
  hotelController.deleteRoomType
);

export default router;
