"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/authRouter.ts
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const authValidation_1 = require("../validations/authValidation");
const router = (0, express_1.Router)();
router.post("/register", (0, validation_1.validate)(authValidation_1.authValidation.register), authController_1.authController.register);
router.post("/login", (0, validation_1.validate)(authValidation_1.authValidation.login), authController_1.authController.login);
// Password reset (unauthenticated)
router.post("/forgot-password", (0, validation_1.validate)(authValidation_1.authValidation.forgotPassword), authController_1.authController.forgotPassword);
router.post("/reset-password/:token", (0, validation_1.validate)(authValidation_1.authValidation.resetPassword), authController_1.authController.resetPassword);
// Protected routes
router.get("/me", auth_1.protect, authController_1.authController.getMe);
router.patch("/me", auth_1.protect, (0, validation_1.validate)(authValidation_1.authValidation.updateProfile), authController_1.authController.updateMe);
router.patch("/change-password", auth_1.protect, (0, validation_1.validate)(authValidation_1.authValidation.changePassword), authController_1.authController.changePassword);
router.patch("/change-email", auth_1.protect, (0, validation_1.validate)(authValidation_1.authValidation.changeEmail), authController_1.authController.changeEmail);
// Logout (blacklists the current token)
router.post("/logout", auth_1.protect, authController_1.authController.logout);
// Email verification
router.get("/verify-email/:token", authController_1.authController.verifyEmail);
router.post("/resend-verification", auth_1.protect, authController_1.authController.resendVerificationEmail);
exports.default = router;
//# sourceMappingURL=authRouter.js.map