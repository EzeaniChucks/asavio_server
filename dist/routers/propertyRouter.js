"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/propertyRouter.ts
const express_1 = require("express");
const propertyController_1 = require("../controllers/propertyController");
const auth_1 = require("../middleware/auth");
const requireKyc_1 = require("../middleware/requireKyc");
const upload_1 = require("../middleware/upload");
const requireTier_1 = require("../middleware/requireTier");
const validation_1 = require("../middleware/validation");
const propertyValidation_1 = require("../validations/propertyValidation");
const router = (0, express_1.Router)();
// Public: distinct property types present in approved listings
router.get("/types", propertyController_1.propertyController.getAvailablePropertyTypes);
// Public: one representative property per type (for Browse by Type cards)
router.get("/type-representatives", propertyController_1.propertyController.getTypeRepresentatives);
// Public: curated home-page discovery sections (top picks, newly listed, popular)
router.get("/sections", propertyController_1.propertyController.getHomeSections);
// Protected: host analytics (available to all tiers, Pro/Elite get richer data)
router.get("/analytics", auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), propertyController_1.propertyController.getAnalytics);
// Protected: host's own listings regardless of status/availability
router.get("/mine", auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), propertyController_1.propertyController.getMyProperties);
router
    .route("/")
    .get(propertyController_1.propertyController.getAllProperties)
    .post(auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), requireKyc_1.requireKyc, upload_1.upload.array("images", 10), (0, validation_1.validate)(propertyValidation_1.propertyValidation.create), propertyController_1.propertyController.createProperty);
// Must be before /:id to avoid Express matching "booked-dates" as the id param
router.get("/:id/booked-dates", propertyController_1.propertyController.getBookedDates);
router.patch("/:id/blocked-dates", auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), propertyController_1.propertyController.updateBlockedDates);
// Feature video — Pro/Elite tier required
router.post("/:id/feature-video", auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), (0, requireTier_1.requireTier)("pro"), upload_1.uploadVideo.single("video"), propertyController_1.propertyController.uploadFeatureVideo);
router.delete("/:id/feature-video", auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), propertyController_1.propertyController.deleteFeatureVideo);
router
    .route("/:id")
    .get(propertyController_1.propertyController.getProperty)
    .patch(auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 10), (0, validation_1.validate)(propertyValidation_1.propertyValidation.update), propertyController_1.propertyController.updateProperty)
    .delete(auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), propertyController_1.propertyController.deleteProperty);
exports.default = router;
//# sourceMappingURL=propertyRouter.js.map