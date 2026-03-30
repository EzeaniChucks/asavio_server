// src/validations/adminValidation.ts
import { body } from "express-validator";
import { ALL_PERMISSIONS } from "../constants/permissions";

export const adminValidation = {
  createAdmin: [
    body("firstName").trim().notEmpty().withMessage("First name is required").isLength({ max: 50 }),
    body("lastName").trim().notEmpty().withMessage("Last name is required").isLength({ max: 50 }),
    body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage("Password must contain uppercase, lowercase, and a number"),
    body("adminPermissions")
      .isArray().withMessage("adminPermissions must be an array")
      .custom((perms: string[]) => {
        const invalid = perms.filter((p) => !ALL_PERMISSIONS.includes(p as any));
        if (invalid.length) throw new Error(`Invalid permissions: ${invalid.join(", ")}`);
        return true;
      }),
  ],

  updateAdminPermissions: [
    body("adminPermissions")
      .isArray().withMessage("adminPermissions must be an array")
      .custom((perms: string[]) => {
        const invalid = perms.filter((p) => !ALL_PERMISSIONS.includes(p as any));
        if (invalid.length) throw new Error(`Invalid permissions: ${invalid.join(", ")}`);
        return true;
      }),
  ],

  setHostCommission: [
    body("commissionRateOverride")
      .optional({ nullable: true })
      .custom((val) => {
        if (val === null) return true;
        const n = Number(val);
        if (isNaN(n) || n < 0 || n > 1) {
          throw new Error("Commission rate must be between 0 and 1 (e.g. 0.15 = 15%)");
        }
        return true;
      }),
  ],

  updateSettings: [
    body("commissionRate")
      .notEmpty().withMessage("commissionRate is required")
      .isFloat({ min: 0, max: 1 }).withMessage("Commission rate must be between 0 and 1"),
  ],
};
