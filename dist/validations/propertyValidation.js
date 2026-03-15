"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyValidation = void 0;
// src/validations/propertyValidation.ts
const express_validator_1 = require("express-validator");
exports.propertyValidation = {
    create: [
        (0, express_validator_1.body)("title")
            .trim()
            .notEmpty()
            .withMessage("Title is required")
            .isLength({ max: 100 })
            .withMessage("Title must be at most 100 characters"),
        (0, express_validator_1.body)("description")
            .trim()
            .notEmpty()
            .withMessage("Description is required")
            .isLength({ min: 50 })
            .withMessage("Description must be at least 50 characters"),
        (0, express_validator_1.body)("propertyType")
            .trim()
            .notEmpty()
            .withMessage("Property type is required"),
        (0, express_validator_1.body)("bedrooms")
            .isInt({ min: 0 })
            .withMessage("Bedrooms must be a non-negative integer"),
        (0, express_validator_1.body)("bathrooms")
            .isInt({ min: 0 })
            .withMessage("Bathrooms must be a non-negative integer"),
        (0, express_validator_1.body)("maxGuests")
            .isInt({ min: 1 })
            .withMessage("Max guests must be at least 1"),
        (0, express_validator_1.body)("pricePerNight")
            .isFloat({ min: 1 })
            .withMessage("Price per night must be greater than 0"),
        (0, express_validator_1.body)("amenities")
            .isArray()
            .withMessage("Amenities must be an array"),
        (0, express_validator_1.body)("location.address")
            .trim()
            .notEmpty()
            .withMessage("Address is required"),
        (0, express_validator_1.body)("location.city")
            .trim()
            .notEmpty()
            .withMessage("City is required"),
        (0, express_validator_1.body)("location.country")
            .trim()
            .notEmpty()
            .withMessage("Country is required"),
    ],
    update: [
        (0, express_validator_1.body)("title")
            .optional()
            .trim()
            .isLength({ max: 100 })
            .withMessage("Title must be at most 100 characters"),
        (0, express_validator_1.body)("description")
            .optional()
            .trim()
            .isLength({ min: 50 })
            .withMessage("Description must be at least 50 characters"),
        (0, express_validator_1.body)("bedrooms")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Bedrooms must be a non-negative integer"),
        (0, express_validator_1.body)("bathrooms")
            .optional()
            .isInt({ min: 0 })
            .withMessage("Bathrooms must be a non-negative integer"),
        (0, express_validator_1.body)("maxGuests")
            .optional()
            .isInt({ min: 1 })
            .withMessage("Max guests must be at least 1"),
        (0, express_validator_1.body)("pricePerNight")
            .optional()
            .isFloat({ min: 1 })
            .withMessage("Price per night must be greater than 0"),
    ],
};
//# sourceMappingURL=propertyValidation.js.map