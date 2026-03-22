"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidation = void 0;
// src/validations/authValidation.ts
const express_validator_1 = require("express-validator");
exports.authValidation = {
    register: [
        (0, express_validator_1.body)("firstName")
            .trim()
            .notEmpty()
            .withMessage("First name is required")
            .isLength({ max: 50 })
            .withMessage("First name must be at most 50 characters"),
        (0, express_validator_1.body)("lastName")
            .trim()
            .notEmpty()
            .withMessage("Last name is required")
            .isLength({ max: 50 })
            .withMessage("Last name must be at most 50 characters"),
        (0, express_validator_1.body)("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please provide a valid email"),
        (0, express_validator_1.body)("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage("Password must contain at least one uppercase letter, one lowercase letter, and one number"),
        (0, express_validator_1.body)("role")
            .optional()
            .isIn(["user", "host"])
            .withMessage("Role must be either 'user' or 'host'"),
    ],
    login: [
        (0, express_validator_1.body)("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please provide a valid email"),
        (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required"),
    ],
    forgotPassword: [
        (0, express_validator_1.body)("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Please provide a valid email"),
    ],
    resetPassword: [
        (0, express_validator_1.body)("password")
            .notEmpty()
            .withMessage("Password is required")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage("Password must contain uppercase, lowercase, and a number"),
    ],
    changePassword: [
        (0, express_validator_1.body)("currentPassword").notEmpty().withMessage("Current password is required"),
        (0, express_validator_1.body)("newPassword")
            .notEmpty()
            .withMessage("New password is required")
            .isLength({ min: 8 })
            .withMessage("Password must be at least 8 characters")
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage("Password must contain uppercase, lowercase, and a number"),
    ],
    changeEmail: [
        (0, express_validator_1.body)("password").notEmpty().withMessage("Password is required to confirm this change"),
        (0, express_validator_1.body)("newEmail")
            .trim()
            .notEmpty()
            .withMessage("New email is required")
            .isEmail()
            .withMessage("Please provide a valid email address"),
    ],
};
//# sourceMappingURL=authValidation.js.map