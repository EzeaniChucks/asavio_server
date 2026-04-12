"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.propertyValidation = void 0;
// src/validations/propertyValidation.ts
const express_validator_1 = require("express-validator");
const propertyTypes_1 = require("../constants/propertyTypes");
// FormData sends everything as strings; parse JSON-encoded fields before validation
const parseJson = (value) => {
    if (typeof value === "string") {
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    return value;
};
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
            .withMessage("Property type is required")
            .customSanitizer((v) => v.toLowerCase())
            .isIn(propertyTypes_1.VALID_PROPERTY_TYPES)
            .withMessage(`Property type must be one of: ${propertyTypes_1.VALID_PROPERTY_TYPES.join(", ")}`),
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
            .customSanitizer(parseJson)
            .isArray()
            .withMessage("Amenities must be an array"),
        (0, express_validator_1.body)("location")
            .customSanitizer(parseJson),
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
        (0, express_validator_1.body)("purposePricing")
            .optional()
            .customSanitizer(parseJson)
            .custom((value) => {
            if (value === null || value === undefined)
                return true;
            if (typeof value !== "object" || Array.isArray(value)) {
                throw new Error("purposePricing must be an object");
            }
            for (const [key, price] of Object.entries(value)) {
                if (typeof key !== "string" || key.trim() === "") {
                    throw new Error("Each purpose must be a non-empty string");
                }
                const n = Number(price);
                if (!Number.isFinite(n) || n <= 0) {
                    throw new Error(`Price for "${key}" must be a positive number`);
                }
            }
            return true;
        }),
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
        (0, express_validator_1.body)("propertyType")
            .optional()
            .trim()
            .customSanitizer((v) => v.toLowerCase())
            .isIn(propertyTypes_1.VALID_PROPERTY_TYPES)
            .withMessage(`Property type must be one of: ${propertyTypes_1.VALID_PROPERTY_TYPES.join(", ")}`),
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
        (0, express_validator_1.body)("amenities").optional().customSanitizer(parseJson),
        (0, express_validator_1.body)("location").optional().customSanitizer(parseJson),
        (0, express_validator_1.body)("purposePricing")
            .optional()
            .customSanitizer(parseJson)
            .custom((value) => {
            if (value === null || value === undefined)
                return true;
            if (typeof value !== "object" || Array.isArray(value)) {
                throw new Error("purposePricing must be an object");
            }
            for (const [key, price] of Object.entries(value)) {
                if (typeof key !== "string" || key.trim() === "") {
                    throw new Error("Each purpose must be a non-empty string");
                }
                const n = Number(price);
                if (!Number.isFinite(n) || n <= 0) {
                    throw new Error(`Price for "${key}" must be a positive number`);
                }
            }
            return true;
        }),
    ],
};
//# sourceMappingURL=propertyValidation.js.map