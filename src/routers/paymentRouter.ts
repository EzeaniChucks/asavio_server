// src/routers/paymentRouter.ts
import { Router } from "express";
import { paymentController } from "../controllers/paymentController";
import { protect } from "../middleware/auth";

const router = Router();

// Paystack webhook — no auth, verified by HMAC signature
router.post("/webhook", paymentController.webhook);

// Verify is intentionally unauthenticated — the Paystack reference is an
// unguessable token and the user may have been redirected from Paystack on
// a fresh session where their JWT has expired.
router.get("/verify/:reference", paymentController.verifyPayment);

// Protected routes
router.use(protect);
router.post("/initialize", paymentController.initializePayment);

export default router;
