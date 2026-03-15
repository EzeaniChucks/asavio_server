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
// Protected routes
router.get("/me", auth_1.protect, authController_1.authController.getMe);
router.patch("/me", auth_1.protect, authController_1.authController.updateMe);
exports.default = router;
//# sourceMappingURL=authRouter.js.map