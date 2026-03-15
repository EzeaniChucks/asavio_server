"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/payoutRouter.ts
const express_1 = require("express");
const payoutController_1 = require("../controllers/payoutController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public — fetch bank list (no auth needed, doesn't reveal any secrets)
router.get("/banks", payoutController_1.payoutController.getBanks);
router.get("/verify-account", payoutController_1.payoutController.verifyAccount);
// Protected — host manages their own bank details
router.use(auth_1.protect);
router.get("/my-bank", payoutController_1.payoutController.getBankDetails);
router.post("/my-bank", (0, auth_1.restrictTo)("host", "admin"), payoutController_1.payoutController.saveBankDetails);
// Admin — payout management
router.get("/pending", (0, auth_1.restrictTo)("admin"), payoutController_1.payoutController.getPendingPayouts);
router.post("/:bookingId/transfer", (0, auth_1.restrictTo)("admin"), payoutController_1.payoutController.processHostPayout);
exports.default = router;
//# sourceMappingURL=payoutRouter.js.map