"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/paymentRouter.ts
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Paystack webhook — no auth, verified by HMAC signature
router.post("/webhook", paymentController_1.paymentController.webhook);
// Protected routes
router.use(auth_1.protect);
router.post("/initialize", paymentController_1.paymentController.initializePayment);
router.get("/verify/:reference", paymentController_1.paymentController.verifyPayment);
exports.default = router;
//# sourceMappingURL=paymentRouter.js.map