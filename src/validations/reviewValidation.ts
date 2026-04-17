// src/validations/reviewValidation.ts
import { body } from "express-validator";

export const reviewValidation = {
  create: [
    body("propertyId")
      .optional()
      .isUUID()
      .withMessage("propertyId must be a valid UUID"),
    body("vehicleId")
      .optional()
      .isUUID()
      .withMessage("vehicleId must be a valid UUID"),
    body("hotelId")
      .optional()
      .isUUID()
      .withMessage("hotelId must be a valid UUID"),
    body("eventCenterId")
      .optional()
      .isUUID()
      .withMessage("eventCenterId must be a valid UUID"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Comment must be between 10 and 1000 characters"),
  ],

  update: [
    body("rating")
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1 and 5"),
    body("comment")
      .optional()
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage("Comment must be between 10 and 1000 characters"),
  ],
};
