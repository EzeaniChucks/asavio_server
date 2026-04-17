"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewValidation = void 0;
// src/validations/reviewValidation.ts
const express_validator_1 = require("express-validator");
exports.reviewValidation = {
    create: [
        (0, express_validator_1.body)("propertyId")
            .optional()
            .isUUID()
            .withMessage("propertyId must be a valid UUID"),
        (0, express_validator_1.body)("vehicleId")
            .optional()
            .isUUID()
            .withMessage("vehicleId must be a valid UUID"),
        (0, express_validator_1.body)("hotelId")
            .optional()
            .isUUID()
            .withMessage("hotelId must be a valid UUID"),
        (0, express_validator_1.body)("eventCenterId")
            .optional()
            .isUUID()
            .withMessage("eventCenterId must be a valid UUID"),
        (0, express_validator_1.body)("rating")
            .isInt({ min: 1, max: 5 })
            .withMessage("Rating must be between 1 and 5"),
        (0, express_validator_1.body)("comment")
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage("Comment must be between 10 and 1000 characters"),
    ],
    update: [
        (0, express_validator_1.body)("rating")
            .optional()
            .isInt({ min: 1, max: 5 })
            .withMessage("Rating must be between 1 and 5"),
        (0, express_validator_1.body)("comment")
            .optional()
            .trim()
            .isLength({ min: 10, max: 1000 })
            .withMessage("Comment must be between 10 and 1000 characters"),
    ],
};
//# sourceMappingURL=reviewValidation.js.map