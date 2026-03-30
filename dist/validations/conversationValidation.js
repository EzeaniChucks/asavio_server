"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationValidation = void 0;
// src/validations/conversationValidation.ts
const express_validator_1 = require("express-validator");
exports.conversationValidation = {
    getOrCreate: [
        (0, express_validator_1.body)("hostId").trim().notEmpty().withMessage("hostId is required").isUUID().withMessage("hostId must be a valid UUID"),
        (0, express_validator_1.body)("propertyId").optional({ nullable: true }).isUUID().withMessage("propertyId must be a valid UUID"),
        (0, express_validator_1.body)("vehicleId").optional({ nullable: true }).isUUID().withMessage("vehicleId must be a valid UUID"),
    ],
};
//# sourceMappingURL=conversationValidation.js.map