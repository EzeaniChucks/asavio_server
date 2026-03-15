// src/routers/authRouter.ts
import { Router } from "express";
import { authController } from "../controllers/authController";
import { protect } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { authValidation } from "../validations/authValidation";

const router = Router();

router.post("/register", validate(authValidation.register), authController.register);
router.post("/login", validate(authValidation.login), authController.login);

// Protected routes
router.get("/me", protect, authController.getMe);
router.patch("/me", protect, authController.updateMe);

export default router;
