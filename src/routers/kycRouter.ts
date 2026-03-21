// src/routers/kycRouter.ts
import { Router } from "express";
import { kycController } from "../controllers/kycController";
import { protect, restrictTo } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();

// Host routes — must be authenticated
router.post(
  "/submit",
  protect,
  restrictTo("host", "admin"),
  upload.single("document"),
  kycController.submit
);

router.get("/status", protect, kycController.getStatus);

// Admin routes
router.get("/", protect, restrictTo("admin"), kycController.listAll);
router.patch("/:userId/review", protect, restrictTo("admin"), kycController.review);

export default router;
