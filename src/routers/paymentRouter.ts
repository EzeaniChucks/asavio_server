// src/routers/paymentRouter.ts
import { Router } from "express";
import { paymentController } from "../controllers/paymentController";
import { protect } from "../middleware/auth";

const router = Router();

// Paystack webhook — no auth, verified by HMAC signature
router.post("/webhook", paymentController.webhook);

// Protected routes
router.use(protect);
router.post("/initialize", paymentController.initializePayment);
router.get("/verify/:reference", paymentController.verifyPayment);

export default router;
