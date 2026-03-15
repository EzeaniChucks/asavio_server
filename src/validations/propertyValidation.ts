// src/validations/propertyValidation.ts
import { body } from "express-validator";

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
      .isArray()
      .withMessage("Amenities must be an array"),
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
  ],
};
