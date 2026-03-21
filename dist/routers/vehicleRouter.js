"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/vehicleRouter.ts
const express_1 = require("express");
const vehicleController_1 = require("../controllers/vehicleController");
const bookingController_1 = require("../controllers/bookingController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const vehicleValidation_1 = require("../validations/vehicleValidation");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Public
router.get("/types", vehicleController_1.vehicleController.getAvailableVehicleTypes);
router.get("/", vehicleController_1.vehicleController.listVehicles);
// Must be before /:id
router.get("/:vehicleId/booked-dates", bookingController_1.bookingController.getVehicleBookedDates);
router.get("/:id", vehicleController_1.vehicleController.getVehicle);
// Protected — host/admin only for mutations
router.use(auth_1.protect);
router.get("/host/my", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.getMyVehicles);
router.post("/", (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 10), (0, validation_1.validate)(vehicleValidation_1.vehicleValidation.create), vehicleController_1.vehicleController.createVehicle);
router.patch("/:id", (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 10), (0, validation_1.validate)(vehicleValidation_1.vehicleValidation.update), vehicleController_1.vehicleController.updateVehicle);
router.delete("/:id", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.deleteVehicle);
router.patch("/:id/toggle-availability", (0, auth_1.restrictTo)("host", "admin"), vehicleController_1.vehicleController.toggleAvailability);
exports.default = router;
//# sourceMappingURL=vehicleRouter.js.map