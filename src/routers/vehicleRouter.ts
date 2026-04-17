// src/routers/vehicleRouter.ts
import { Router } from "express";
import { vehicleController } from "../controllers/vehicleController";
import { protect, restrictTo } from "../middleware/auth";
import { requireKyc } from "../middleware/requireKyc";
import { validate } from "../middleware/validation";
import { vehicleValidation } from "../validations/vehicleValidation";
import { upload, uploadVideo } from "../middleware/upload";
import { requireTier } from "../middleware/requireTier";

const router = Router();

// Public
router.get("/types", vehicleController.getAvailableVehicleTypes);
router.get("/type-representatives", vehicleController.getVehicleTypeRepresentatives);
router.get("/", vehicleController.listVehicles);
// Must be before /:id — returns bookings + blocked ranges combined
router.get("/:id/booked-dates", vehicleController.getBookedDates);
router.get("/:id", vehicleController.getVehicle);

// Protected — host/admin only for mutations
router.use(protect);

router.get("/host/my", restrictTo("host", "admin"), vehicleController.getMyVehicles);

router.post(
  "/",
  restrictTo("host", "admin"),
  requireKyc,
  upload.array("images", 10),
  validate(vehicleValidation.create),
  vehicleController.createVehicle
);

router.patch(
  "/:id",
  restrictTo("host", "admin"),
  upload.array("images", 10),
  validate(vehicleValidation.update),
  vehicleController.updateVehicle
);

router.delete("/:id", restrictTo("host", "admin"), vehicleController.deleteVehicle);

router.patch(
  "/:id/toggle-availability",
  restrictTo("host", "admin"),
  vehicleController.toggleAvailability
);

router.patch(
  "/:id/blocked-dates",
  restrictTo("host", "admin"),
  vehicleController.updateBlockedDates
);

// Feature video — Pro/Elite tier required
router.post(
  "/:id/feature-video",
  restrictTo("host", "admin"),
  requireTier("pro"),
  uploadVideo.single("video"),
  vehicleController.uploadFeatureVideo
);
router.delete(
  "/:id/feature-video",
  restrictTo("host", "admin"),
  vehicleController.deleteFeatureVideo
);

export default router;
