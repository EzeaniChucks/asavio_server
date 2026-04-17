"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/vehicleRouter.ts
const express_1 = require("express");
const vehicleController_1 = require("../controllers/vehicleController");
const auth_1 = require("../middleware/auth");
const requireKyc_1 = require("../middleware/requireKyc");
const validation_1 = require("../middleware/validation");
const vehicleValidation_1 = require("../validations/vehicleValidation");
const upload_1 = require("../middleware/upload");
const requireTier_1 = require("../middleware/requireTier");
const router = (0, express_1.Router)();
// Public
router.get("/types", vehicleController_1.vehicleController.getAvailableVehicleTypes);
router.get("/type-representatives", vehicleController_1.vehicleController.getVehicleTypeRepresentatives);
router.get("/", vehicleController_1.vehicleController.listVehicles);
// Must be before /:id — returns bookings + blocked ranges combined
router.get("/:id/booked-dates", vehicleController_1.vehicleController.getBookedDates);
router.get("/:id", vehicleController_1.vehicleController.getVehicle);
// Protected — host/admin only for mutations
router.use(auth_1.protect);
router.get("/host/my", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.getMyVehicles);
router.post("/", (0, auth_1.restrictTo)("host", "admin"), requireKyc_1.requireKyc, upload_1.upload.array("images", 10), (0, validation_1.validate)(vehicleValidation_1.vehicleValidation.create), vehicleController_1.vehicleController.createVehicle);
router.patch("/:id", (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 10), (0, validation_1.validate)(vehicleValidation_1.vehicleValidation.update), vehicleController_1.vehicleController.updateVehicle);
router.delete("/:id", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.deleteVehicle);
router.patch("/:id/toggle-availability", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.toggleAvailability);
router.patch("/:id/blocked-dates", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.updateBlockedDates);
// Feature video — Pro/Elite tier required
router.post("/:id/feature-video", (0, auth_1.restrictTo)("host", "admin"), (0, requireTier_1.requireTier)("pro"), upload_1.uploadVideo.single("video"), vehicleController_1.vehicleController.uploadFeatureVideo);
router.delete("/:id/feature-video", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.deleteFeatureVideo);
exports.default = router;
//# sourceMappingURL=vehicleRouter.js.map