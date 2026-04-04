// src/routers/propertyRouter.ts
import { Router } from "express";
import { propertyController } from "../controllers/propertyController";
import { protect, restrictTo } from "../middleware/auth";
import { upload, uploadVideo } from "../middleware/upload";
import { requireTier } from "../middleware/requireTier";
import { validate } from "../middleware/validation";
import { propertyValidation } from "../validations/propertyValidation";

const router = Router();

// Public: distinct property types present in approved listings
router.get("/types", propertyController.getAvailablePropertyTypes);

// Public: one representative property per type (for Browse by Type cards)
router.get("/type-representatives", propertyController.getTypeRepresentatives);

// Public: curated home-page discovery sections (top picks, newly listed, popular)
router.get("/sections", propertyController.getHomeSections);

// Protected: host analytics (available to all tiers, Pro/Elite get richer data)
router.get("/analytics", protect, restrictTo("host", "admin"), propertyController.getAnalytics);

// Protected: host's own listings regardless of status/availability
router.get(
  "/mine",
  protect,
  restrictTo("host", "admin"),
  propertyController.getMyProperties
);

router
  .route("/")
  .get(propertyController.getAllProperties)
  .post(
    protect,
    restrictTo("host", "admin"),
    upload.array("images", 10),
    validate(propertyValidation.create),
    propertyController.createProperty
  );

// Must be before /:id to avoid Express matching "booked-dates" as the id param
router.get("/:id/booked-dates", propertyController.getBookedDates);
router.patch(
  "/:id/blocked-dates",
  protect,
  restrictTo("host", "admin"),
  propertyController.updateBlockedDates
);

// Feature video — Pro/Elite tier required
router.post(
  "/:id/feature-video",
  protect,
  restrictTo("host", "admin"),
  requireTier("pro"),
  uploadVideo.single("video"),
  propertyController.uploadFeatureVideo
);
router.delete(
  "/:id/feature-video",
  protect,
  restrictTo("host", "admin"),
  propertyController.deleteFeatureVideo
);

router
  .route("/:id")
  .get(propertyController.getProperty)
  .patch(
    protect,
    restrictTo("host", "admin"),
    upload.array("images", 10),
    validate(propertyValidation.update),
    propertyController.updateProperty
  )
  .delete(
    protect,
    restrictTo("host", "admin"),
    propertyController.deleteProperty
  );

export default router;
