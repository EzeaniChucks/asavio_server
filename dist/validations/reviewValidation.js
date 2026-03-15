"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewValidation = void 0;
// src/validations/reviewValidation.ts
const express_validator_1 = require("express-validator");
exports.reviewValidation = {
    create: [
        (0, express_validator_1.body)("propertyId")
            .isUUID()
            .withMessage("Valid property ID required"),
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