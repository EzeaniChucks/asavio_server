// src/routers/subscriptionRouter.ts
import { Router } from "express";
import { subscriptionController } from "../controllers/subscriptionController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

// Public — UI needs to show tier comparison without auth
router.get("/tiers", subscriptionController.getTierConfig);

// Protected — host only
router.use(protect, restrictTo("host", "admin"));

router.get("/me", subscriptionController.getMySubscription);
router.post("/initiate", subscriptionController.initiateSubscription);
router.delete("/cancel", subscriptionController.cancelSubscription);

export default router;
