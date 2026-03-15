"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const express_validator_1 = require("express-validator");
const AppError_1 = require("../utils/AppError");
const validate = (validations) => {
    return async (req, _res, next) => {
        for (const validation of validations) {
            const result = await validation.run(req);
            if (!result.isEmpty())
                break;
        }
        const errors = (0, express_validator_1.validationResult)(req);
        if (errors.isEmpty()) {
            return next();
        }
        const errorMessages = errors
            .array()
            .map((e) => e.msg)
            .join(", ");
        return next(new AppError_1.AppError(errorMessages, 400));
    };
};
exports.validate = validate;
//# sourceMappingURL=validation.js.map