// src/validations/conversationValidation.ts
import { body } from "express-validator";

export const conversationValidation = {
  getOrCreate: [
    body("hostId").trim().notEmpty().withMessage("hostId is required").isUUID().withMessage("hostId must be a valid UUID"),
    body("propertyId").optional({ nullable: true }).isUUID().withMessage("propertyId must be a valid UUID"),
    body("vehicleId").optional({ nullable: true }).isUUID().withMessage("vehicleId must be a valid UUID"),
  ],
};
