"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/subscriptionRouter.ts
const express_1 = require("express");
const subscriptionController_1 = require("../controllers/subscriptionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public — UI needs to show tier comparison without auth
router.get("/tiers", subscriptionController_1.subscriptionController.getTierConfig);
// Protected — host only
router.use(auth_1.protect, (0, auth_1.restrictTo)("host", "admin"));
router.get("/me", subscriptionController_1.subscriptionController.getMySubscription);
router.post("/initiate", subscriptionController_1.subscriptionController.initiateSubscription);
router.delete("/cancel", subscriptionController_1.subscriptionController.cancelSubscription);
exports.default = router;
//# sourceMappingURL=subscriptionRouter.js.map