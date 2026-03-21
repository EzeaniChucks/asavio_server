// src/routers/propertyRouter.ts
import { Router } from "express";
import { propertyController } from "../controllers/propertyController";
import { protect, restrictTo } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { validate } from "../middleware/validation";
import { propertyValidation } from "../validations/propertyValidation";

const router = Router();

// Public: distinct property types present in approved listings
router.get("/types", propertyController.getAvailablePropertyTypes);

// Public: curated home-page discovery sections (top picks, newly listed, popular)
router.get("/sections", propertyController.getHomeSections);

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

router
  .route("/:id")
  .get(propertyController.getProperty)
  .patch(
    protect,
    restrictTo("host", "admin"),
    validate(propertyValidation.update),
    propertyController.updateProperty
  )
  .delete(
    protect,
    restrictTo("host", "admin"),
    propertyController.deleteProperty
  );

export default router;
