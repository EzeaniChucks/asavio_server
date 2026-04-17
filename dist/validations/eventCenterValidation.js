"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventCenterValidation = void 0;
// src/validations/eventCenterValidation.ts
const express_validator_1 = require("express-validator");
exports.eventCenterValidation = {
    create: [
        (0, express_validator_1.body)("name").trim().isLength({ min: 3, max: 200 }).withMessage("Name must be 3–200 characters"),
        (0, express_validator_1.body)("description").trim().isLength({ min: 30 }).withMessage("Description must be at least 30 characters"),
        (0, express_validator_1.body)("cancellationPolicy")
            .optional()
            .isIn(["flexible", "moderate", "firm", "strict"])
            .withMessage("Invalid cancellation policy"),
    ],
    update: [
        (0, express_validator_1.body)("name").optional().trim().isLength({ min: 3, max: 200 }),
        (0, express_validator_1.body)("description").optional().trim().isLength({ min: 30 }),
        (0, express_validator_1.body)("cancellationPolicy")
            .optional()
            .isIn(["flexible", "moderate", "firm", "strict"]),
        (0, express_validator_1.body)("isAvailable").optional().isBoolean(),
    ],
    createSpace: [
        (0, express_validator_1.body)("name").trim().isLength({ min: 2, max: 100 }).withMessage("Space name required"),
        (0, express_validator_1.body)("capacity").isInt({ min: 1, max: 10000 }).withMessage("Capacity must be 1–10,000"),
        (0, express_validator_1.body)("pricingMode")
            .isIn(["hourly", "daily", "package", "hybrid"])
            .withMessage("pricingMode must be hourly, daily, package, or hybrid"),
        (0, express_validator_1.body)("hourlyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
        (0, express_validator_1.body)("minHours").optional().isInt({ min: 1, max: 24 }),
        (0, express_validator_1.body)("dailyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
        (0, express_validator_1.body)("packageRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
        (0, express_validator_1.body)("packageHoursIncluded").optional({ checkFalsy: true }).isInt({ min: 1, max: 48 }),
        (0, express_validator_1.body)("setupMinutes").optional().isInt({ min: 0, max: 480 }),
        (0, express_validator_1.body)("teardownMinutes").optional().isInt({ min: 0, max: 480 }),
    ],
    updateSpace: [
        (0, express_validator_1.body)("name").optional().trim().isLength({ min: 2, max: 100 }),
        (0, express_validator_1.body)("capacity").optional().isInt({ min: 1, max: 10000 }),
        (0, express_validator_1.body)("pricingMode").optional().isIn(["hourly", "daily", "package", "hybrid"]),
        (0, express_validator_1.body)("hourlyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
        (0, express_validator_1.body)("minHours").optional().isInt({ min: 1, max: 24 }),
        (0, express_validator_1.body)("dailyRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
        (0, express_validator_1.body)("packageRate").optional({ checkFalsy: true }).isFloat({ min: 0 }),
        (0, express_validator_1.body)("packageHoursIncluded").optional({ checkFalsy: true }).isInt({ min: 1, max: 48 }),
        (0, express_validator_1.body)("setupMinutes").optional().isInt({ min: 0, max: 480 }),
        (0, express_validator_1.body)("teardownMinutes").optional().isInt({ min: 0, max: 480 }),
    ],
    createBooking: [
        (0, express_validator_1.body)("eventCenterId").isUUID().withMessage("Invalid event center ID"),
        (0, express_validator_1.body)("eventSpaceId").isUUID().withMessage("Invalid event space ID"),
        (0, express_validator_1.body)("eventDate").isISO8601().withMessage("eventDate must be YYYY-MM-DD"),
        (0, express_validator_1.body)("startTime").matches(/^\d{2}:\d{2}$/).withMessage("startTime must be HH:MM"),
        (0, express_validator_1.body)("endTime").matches(/^\d{2}:\d{2}$/).withMessage("endTime must be HH:MM"),
        (0, express_validator_1.body)("eventType").trim().notEmpty().withMessage("Event type is required"),
        (0, express_validator_1.body)("attendeeCount").isInt({ min: 1 }).withMessage("At least 1 attendee"),
        (0, express_validator_1.body)("pricingUsed")
            .isIn(["hourly", "daily", "package"])
            .withMessage("pricingUsed must be hourly, daily, or package"),
        (0, express_validator_1.body)("specialRequests").optional().trim().isLength({ max: 500 }),
    ],
};
//# sourceMappingURL=eventCenterValidation.js.map