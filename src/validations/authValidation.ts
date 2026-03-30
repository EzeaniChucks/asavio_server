// src/validations/authValidation.ts
import { body } from "express-validator";

export const authValidation = {
  register: [
    body("firstName")
      .trim()
      .notEmpty()
      .withMessage("First name is required")
      .isLength({ max: 50 })
      .withMessage("First name must be at most 50 characters"),
    body("lastName")
      .trim()
      .notEmpty()
      .withMessage("Last name is required")
      .isLength({ max: 50 })
      .withMessage("Last name must be at most 50 characters"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    body("role")
      .optional()
      .isIn(["user", "host"])
      .withMessage("Role must be either 'user' or 'host'"),
  ],

  login: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],

  forgotPassword: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Please provide a valid email"),
  ],

  resetPassword: [
    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain uppercase, lowercase, and a number"),
  ],

  changePassword: [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .notEmpty()
      .withMessage("New password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain uppercase, lowercase, and a number"),
  ],

  changeEmail: [
    body("password").notEmpty().withMessage("Password is required to confirm this change"),
    body("newEmail")
      .trim()
      .notEmpty()
      .withMessage("New email is required")
      .isEmail()
      .withMessage("Please provide a valid email address"),
  ],

  updateProfile: [
    body("firstName").optional().trim().isLength({ min: 1, max: 50 }).withMessage("First name must be 1–50 characters"),
    body("lastName").optional().trim().isLength({ min: 1, max: 50 }).withMessage("Last name must be 1–50 characters"),
    body("phone").optional().trim().isLength({ max: 20 }).withMessage("Phone must be at most 20 characters"),
    // Block fields that should never be updated via this endpoint
    body("role").not().exists().withMessage("Role cannot be changed via this endpoint"),
    body("password").not().exists().withMessage("Use /change-password to update your password"),
    body("isVerified").not().exists().withMessage("Field not allowed"),
    body("isEmailVerified").not().exists().withMessage("Field not allowed"),
    body("isSuperAdmin").not().exists().withMessage("Field not allowed"),
    body("adminPermissions").not().exists().withMessage("Field not allowed"),
  ],
};
