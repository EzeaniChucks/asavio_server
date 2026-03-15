"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingValidation = void 0;
// src/validations/bookingValidation.ts
const express_validator_1 = require("express-validator");
exports.bookingValidation = {
    create: [
        (0, express_validator_1.body)("propertyId")
            .trim()
            .notEmpty()
            .withMessage("Property ID is required")
            .isUUID()
            .withMessage("Invalid property ID"),
        (0, express_validator_1.body)("checkIn")
            .notEmpty()
            .withMessage("Check-in date is required")
            .isISO8601()
            .withMessage("Check-in must be a valid date (YYYY-MM-DD)")
            .custom((val) => {
            if (new Date(val) < new Date(new Date().toDateString())) {
                throw new Error("Check-in date cannot be in the past");
            }
            return true;
        }),
        (0, express_validator_1.body)("checkOut")
            .notEmpty()
            .withMessage("Check-out date is required")
            .isISO8601()
            .withMessage("Check-out must be a valid date (YYYY-MM-DD)")
            .custom((val, { req }) => {
            if (new Date(val) <= new Date(req.body.checkIn)) {
                throw new Error("Check-out must be after check-in");
            }
            return true;
        }),
        (0, express_validator_1.body)("guests")
            .isInt({ min: 1 })
            .withMessage("At least 1 guest is required"),
        (0, express_validator_1.body)("specialRequests")
            .optional()
            .trim()
            .isLength({ max: 500 })
            .withMessage("Special requests must be at most 500 characters"),
    ],
    updateStatus: [
        (0, express_validator_1.param)("id").isUUID().withMessage("Invalid booking ID"),
        (0, express_validator_1.body)("status")
            .isIn(["confirmed", "cancelled", "completed"])
            .withMessage("Status must be one of: confirmed, cancelled, completed"),
    ],
};
//# sourceMappingURL=bookingValidation.js.map