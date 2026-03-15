// src/validations/vehicleValidation.ts
import { body } from "express-validator";

export const vehicleValidation = {
  create: [
    body("make").trim().notEmpty().withMessage("Make is required"),
    body("model").trim().notEmpty().withMessage("Model is required"),
    body("year")
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage("Valid year required"),
    body("vehicleType")
      .isIn(["sedan", "suv", "sports", "luxury", "van", "pickup", "convertible", "electric"])
      .withMessage("Invalid vehicle type"),
    body("pricePerDay")
      .isFloat({ min: 1 })
      .withMessage("Price per day must be a positive number"),
    body("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 characters"),
    body("seats").isInt({ min: 1, max: 20 }).withMessage("Seats must be between 1 and 20"),
    body("withDriver").optional().isBoolean(),
    body("location").optional().trim(),
    body("features").optional().isArray(),
  ],

  update: [
    body("make").optional().trim().notEmpty(),
    body("model").optional().trim().notEmpty(),
    body("year").optional().isInt({ min: 1990, max: new Date().getFullYear() + 1 }),
    body("vehicleType")
      .optional()
      .isIn(["sedan", "suv", "sports", "luxury", "van", "pickup", "convertible", "electric"]),
    body("pricePerDay").optional().isFloat({ min: 1 }),
    body("description").optional().trim().isLength({ min: 20 }),
    body("seats").optional().isInt({ min: 1, max: 20 }),
    body("withDriver").optional().isBoolean(),
    body("location").optional().trim(),
    body("features").optional().isArray(),
    body("isAvailable").optional().isBoolean(),
  ],
};
