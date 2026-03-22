// src/validations/propertyValidation.ts
import { body } from "express-validator";

// FormData sends everything as strings; parse JSON-encoded fields before validation
const parseJson = (value: unknown) => {
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return value; }
  }
  return value;
};

export const propertyValidation = {
  create: [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 100 })
      .withMessage("Title must be at most 100 characters"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required")
      .isLength({ min: 50 })
      .withMessage("Description must be at least 50 characters"),
    body("propertyType")
      .trim()
      .notEmpty()
      .withMessage("Property type is required"),
    body("bedrooms")
      .isInt({ min: 0 })
      .withMessage("Bedrooms must be a non-negative integer"),
    body("bathrooms")
      .isInt({ min: 0 })
      .withMessage("Bathrooms must be a non-negative integer"),
    body("maxGuests")
      .isInt({ min: 1 })
      .withMessage("Max guests must be at least 1"),
    body("pricePerNight")
      .isFloat({ min: 1 })
      .withMessage("Price per night must be greater than 0"),
    body("amenities")
      .customSanitizer(parseJson)
      .isArray()
      .withMessage("Amenities must be an array"),
    body("location")
      .customSanitizer(parseJson),
    body("location.address")
      .trim()
      .notEmpty()
      .withMessage("Address is required"),
    body("location.city")
      .trim()
      .notEmpty()
      .withMessage("City is required"),
    body("location.country")
      .trim()
      .notEmpty()
      .withMessage("Country is required"),
    body("purposePricing")
      .optional()
      .customSanitizer(parseJson)
      .custom((value) => {
        if (value === null || value === undefined) return true;
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
    body("title")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Title must be at most 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ min: 50 })
      .withMessage("Description must be at least 50 characters"),
    body("bedrooms")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Bedrooms must be a non-negative integer"),
    body("bathrooms")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Bathrooms must be a non-negative integer"),
    body("maxGuests")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Max guests must be at least 1"),
    body("pricePerNight")
      .optional()
      .isFloat({ min: 1 })
      .withMessage("Price per night must be greater than 0"),
    body("amenities").optional().customSanitizer(parseJson),
    body("location").optional().customSanitizer(parseJson),
    body("purposePricing")
      .optional()
      .customSanitizer(parseJson)
      .custom((value) => {
        if (value === null || value === undefined) return true;
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
