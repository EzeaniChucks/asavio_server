"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminValidation = void 0;
// src/validations/adminValidation.ts
const express_validator_1 = require("express-validator");
const permissions_1 = require("../constants/permissions");
exports.adminValidation = {
    createAdmin: [
        (0, express_validator_1.body)("firstName").trim().notEmpty().withMessage("First name is required").isLength({ max: 50 }),
        (0, express_validator_1.body)("lastName").trim().notEmpty().withMessage("Last name is required").isLength({ max: 50 }),
        (0, express_validator_1.body)("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Valid email required"),
        (0, express_validator_1.body)("adminPermissions")
            .isArray().withMessage("adminPermissions must be an array")
            .custom((perms) => {
            const invalid = perms.filter((p) => !permissions_1.ALL_PERMISSIONS.includes(p));
            if (invalid.length)
                throw new Error(`Invalid permissions: ${invalid.join(", ")}`);
            return true;
        }),
    ],
    updateAdminPermissions: [
        (0, express_validator_1.body)("adminPermissions")
            .isArray().withMessage("adminPermissions must be an array")
            .custom((perms) => {
            const invalid = perms.filter((p) => !permissions_1.ALL_PERMISSIONS.includes(p));
            if (invalid.length)
                throw new Error(`Invalid permissions: ${invalid.join(", ")}`);
            return true;
        }),
    ],
    setHostCommission: [
        (0, express_validator_1.body)("commissionRateOverride")
            .optional({ nullable: true })
            .custom((val) => {
            if (val === null)
                return true;
            const n = Number(val);
            if (isNaN(n) || n < 0 || n > 1) {
                throw new Error("Commission rate must be between 0 and 1 (e.g. 0.15 = 15%)");
            }
            return true;
        }),
    ],
    updateSettings: [
        (0, express_validator_1.body)("commissionRate")
            .notEmpty().withMessage("commissionRate is required")
            .isFloat({ min: 0, max: 1 }).withMessage("Commission rate must be between 0 and 1"),
    ],
};
//# sourceMappingURL=adminValidation.js.map