// src/routers/vehicleRouter.ts
import { Router } from "express";
import { vehicleController } from "../controllers/vehicleController";
import { bookingController } from "../controllers/bookingController";
import { protect, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { vehicleValidation } from "../validations/vehicleValidation";
import { upload } from "../middleware/upload";

const router = Router();

// Public
router.get("/types", vehicleController.getAvailableVehicleTypes);
router.get("/", vehicleController.listVehicles);
// Must be before /:id
router.get("/:vehicleId/booked-dates", bookingController.getVehicleBookedDates);
router.get("/:id", vehicleController.getVehicle);

// Protected — host/admin only for mutations
router.use(protect);

router.get("/host/my", restrictTo("host", "admin"), vehicleController.getMyVehicles);

router.post(
  "/",
  restrictTo("host", "admin"),
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

export default router;
