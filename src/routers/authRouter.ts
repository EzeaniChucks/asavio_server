// src/routers/authRouter.ts
import { Router } from "express";
import { authController } from "../controllers/authController";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { authValidation } from "../validations/authValidation";

const router = Router();

router.post("/register", validate(authValidation.register), authController.register);
router.post("/login", validate(authValidation.login), authController.login);

// Password reset (unauthenticated)
router.post("/forgot-password", validate(authValidation.forgotPassword), authController.forgotPassword);
router.post("/reset-password/:token", validate(authValidation.resetPassword), authController.resetPassword);

// Protected routes
router.get("/me", protect, authController.getMe);
router.patch("/me", protect, authController.updateMe);
router.patch("/change-password", protect, validate(authValidation.changePassword), authController.changePassword);
router.patch("/change-email", protect, validate(authValidation.changeEmail), authController.changeEmail);

export default router;
