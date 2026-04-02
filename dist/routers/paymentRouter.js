"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/paymentRouter.ts
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Paystack webhook — no auth, verified by HMAC signature
router.post("/webhook", paymentController_1.paymentController.webhook);
// Verify is intentionally unauthenticated — the Paystack reference is an
// unguessable token and the user may have been redirected from Paystack on
// a fresh session where their JWT has expired.
router.get("/verify/:reference", paymentController_1.paymentController.verifyPayment);
// Protected routes
router.use(auth_1.protect);
router.post("/initialize", paymentController_1.paymentController.initializePayment);
exports.default = router;
//# sourceMappingURL=paymentRouter.js.map