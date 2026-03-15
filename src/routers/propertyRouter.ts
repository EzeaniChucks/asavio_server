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
