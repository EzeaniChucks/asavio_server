"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleValidation = void 0;
// src/validations/vehicleValidation.ts
const express_validator_1 = require("express-validator");
exports.vehicleValidation = {
    create: [
        (0, express_validator_1.body)("make").trim().notEmpty().withMessage("Make is required"),
        (0, express_validator_1.body)("model").trim().notEmpty().withMessage("Model is required"),
        (0, express_validator_1.body)("year")
            .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
            .withMessage("Valid year required"),
        (0, express_validator_1.body)("vehicleType")
            .isIn(["sedan", "suv", "sports", "luxury", "van", "pickup", "convertible", "electric"])
            .withMessage("Invalid vehicle type"),
        (0, express_validator_1.body)("pricePerDay")
            .isFloat({ min: 1 })
            .withMessage("Price per day must be a positive number"),
        (0, express_validator_1.body)("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
        (0, express_validator_1.body)("seats").isInt({ min: 1, max: 20 }).withMessage("Seats must be between 1 and 20"),
        (0, express_validator_1.body)("withDriver").optional().isBoolean(),
        (0, express_validator_1.body)("location").optional().trim(),
        (0, express_validator_1.body)("features").optional().isArray(),
    ],
    update: [
        (0, express_validator_1.body)("make").optional().trim().notEmpty(),
        (0, express_validator_1.body)("model").optional().trim().notEmpty(),
        (0, express_validator_1.body)("year").optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
        (0, express_validator_1.body)("vehicleType")
            .optional()
            .isIn(["sedan", "suv", "sports", "luxury", "van", "pickup", "convertible", "electric"]),
        (0, express_validator_1.body)("pricePerDay").optional().isFloat({ min: 1 }),
        (0, express_validator_1.body)("description").optional().trim().isLength({ min: 20 }),
        (0, express_validator_1.body)("seats").optional().isInt({ min: 1, max: 20 }),
        (0, express_validator_1.body)("withDriver").optional().isBoolean(),
        (0, express_validator_1.body)("location").optional().trim(),
        (0, express_validator_1.body)("features").optional().isArray(),
        (0, express_validator_1.body)("isAvailable").optional().isBoolean(),
    ],
};
//# sourceMappingURL=vehicleValidation.js.map