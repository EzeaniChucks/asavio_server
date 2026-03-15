"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/reviewRouter.ts
const express_1 = require("express");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const reviewValidation_1 = require("../validations/reviewValidation");
const router = (0, express_1.Router)();
// Public
router.get("/property/:propertyId", reviewController_1.reviewController.getPropertyReviews);
router.get("/vehicle/:vehicleId", reviewController_1.reviewController.getVehicleReviews);
// Protected
router.use(auth_1.protect);
router.post("/", (0, validation_1.validate)(reviewValidation_1.reviewValidation.create), reviewController_1.reviewController.createReview);
router.patch("/:id", (0, validation_1.validate)(reviewValidation_1.reviewValidation.update), reviewController_1.reviewController.updateReview);
router.delete("/:id", reviewController_1.reviewController.deleteReview);
// Admin
router.get("/", (0, auth_1.restrictTo)("admin"), reviewController_1.reviewController.getAllReviews);
exports.default = router;
//# sourceMappingURL=reviewRouter.js.map