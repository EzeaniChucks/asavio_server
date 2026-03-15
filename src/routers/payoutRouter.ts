// src/routers/payoutRouter.ts
import { Router } from "express";
import { payoutController } from "../controllers/payoutController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

// Public — fetch bank list (no auth needed, doesn't reveal any secrets)
router.get("/banks", payoutController.getBanks);
router.get("/verify-account", payoutController.verifyAccount);

// Protected — host manages their own bank details
router.use(protect);
router.get("/my-bank", payoutController.getBankDetails);
router.post("/my-bank", restrictTo("host", "admin"), payoutController.saveBankDetails);

// Admin — payout management
router.get("/pending", restrictTo("admin"), payoutController.getPendingPayouts);
router.post("/:bookingId/transfer", restrictTo("admin"), payoutController.processHostPayout);

export default router;
