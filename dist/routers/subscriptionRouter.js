"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/subscriptionRouter.ts
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../constants/permissions");
const router = (0, express_1.Router)();
// Public — UI needs to show tier comparison without auth
router.get("/tiers", subscriptionController_1.subscriptionController.getTierConfig);
// Protected — host + admin
router.use(auth_1.protect, (0, auth_1.restrictTo)("host", "admin"));
router.get("/me", subscriptionController_1.subscriptionController.getMySubscription);
router.post("/initiate", subscriptionController_1.subscriptionController.initiateSubscription);
router.post("/verify", subscriptionController_1.subscriptionController.verifySubscription);
router.delete("/cancel", subscriptionController_1.subscriptionController.cancelSubscription);
// Admin-only
router.get("/admin", (0, auth_1.restrictTo)("admin"), (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController_1.subscriptionController.adminListSubscriptions);
router.get("/admin/stats", (0, auth_1.restrictTo)("admin"), (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController_1.subscriptionController.adminGetStats);
router.get("/admin/tier-config", (0, auth_1.restrictTo)("admin"), (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController_1.subscriptionController.adminGetTierConfig);
router.patch("/admin/tier-config/:tier", (0, auth_1.restrictTo)("admin"), (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController_1.subscriptionController.adminUpdateTierConfig);
router.delete("/admin/:id", (0, auth_1.restrictTo)("admin"), (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_SUBSCRIPTIONS), subscriptionController_1.subscriptionController.adminCancelSubscription);
exports.default = router;
//# sourceMappingURL=subscriptionRouter.js.map