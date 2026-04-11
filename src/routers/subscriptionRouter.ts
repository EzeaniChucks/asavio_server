// src/routers/subscriptionRouter.ts
import { Router } from "express";
import { subscriptionController } from "../controllers/subscriptionController";
import { protect, restrictTo, hasPermission } from "../middleware/auth";
import { ADMIN_PERMISSIONS } from "../constants/permissions";

const router = Router();

// Public — UI needs to show tier comparison without auth
router.get("/tiers", subscriptionController.getTierConfig);

// Protected — host + admin
router.use(protect, restrictTo("host", "admin"));

router.get("/me", subscriptionController.getMySubscription);
router.post("/initiate", subscriptionController.initiateSubscription);
router.post("/verify", subscriptionController.verifySubscription);
router.delete("/cancel", subscriptionController.cancelSubscription);

// Admin-only
router.get   ("/admin",                    restrictTo("admin"), hasPermission(ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController.adminListSubscriptions);
router.get   ("/admin/stats",              restrictTo("admin"), hasPermission(ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController.adminGetStats);
router.get   ("/admin/tier-config",        restrictTo("admin"), hasPermission(ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController.adminGetTierConfig);
router.patch ("/admin/tier-config/:tier",  restrictTo("admin"), hasPermission(ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController.adminUpdateTierConfig);
router.delete("/admin/:id",               restrictTo("admin"), hasPermission(ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController.adminCancelSubscription);

export default router;
