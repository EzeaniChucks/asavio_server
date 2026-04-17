// src/routers/reviewRouter.ts
import { Router } from "express";
import { reviewController } from "../controllers/reviewController";
import { protect, restrictTo } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { reviewValidation } from "../validations/reviewValidation";

const router = Router();

// Public
router.get("/property/:propertyId", reviewController.getPropertyReviews);
router.get("/vehicle/:vehicleId", reviewController.getVehicleReviews);
router.get("/hotel/:hotelId", reviewController.getHotelReviews);
router.get("/event-center/:eventCenterId", reviewController.getEventCenterReviews);

// Protected
router.use(protect);

router.post(
  "/",
  validate(reviewValidation.create),
  reviewController.createReview
);

router.patch(
  "/:id",
  validate(reviewValidation.update),
  reviewController.updateReview
);

router.delete("/:id", reviewController.deleteReview);

// Admin
router.get("/", restrictTo("admin"), reviewController.getAllReviews);

export default router;
