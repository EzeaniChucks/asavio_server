"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hotelValidation = void 0;
// src/validations/hotelValidation.ts
const express_validator_1 = require("express-validator");
exports.hotelValidation = {
    create: [
        (0, express_validator_1.body)("name").trim().isLength({ min: 3, max: 200 }).withMessage("Name must be 3–200 characters"),
        (0, express_validator_1.body)("description").trim().isLength({ min: 30 }).withMessage("Description must be at least 30 characters"),
        (0, express_validator_1.body)("hotelType").optional().trim(),
        (0, express_validator_1.body)("starRating").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage("Star rating must be 1–5"),
        (0, express_validator_1.body)("checkInTime").optional().matches(/^\d{2}:\d{2}$/).withMessage("checkInTime must be HH:MM"),
        (0, express_validator_1.body)("checkOutTime").optional().matches(/^\d{2}:\d{2}$/).withMessage("checkOutTime must be HH:MM"),
        (0, express_validator_1.body)("cancellationPolicy")
            .optional()
            .isIn(["flexible", "moderate", "firm", "strict"])
            .withMessage("Invalid cancellation policy"),
    ],
    update: [
        (0, express_validator_1.body)("name").optional().trim().isLength({ min: 3, max: 200 }),
        (0, express_validator_1.body)("description").optional().trim().isLength({ min: 30 }),
        (0, express_validator_1.body)("hotelType").optional().trim(),
        (0, express_validator_1.body)("starRating").optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }),
        (0, express_validator_1.body)("checkInTime").optional().matches(/^\d{2}:\d{2}$/),
        (0, express_validator_1.body)("checkOutTime").optional().matches(/^\d{2}:\d{2}$/),
        (0, express_validator_1.body)("cancellationPolicy")
            .optional()
            .isIn(["flexible", "moderate", "firm", "strict"]),
        (0, express_validator_1.body)("isAvailable").optional().isBoolean(),
    ],
    createRoomType: [
        (0, express_validator_1.body)("name").trim().isLength({ min: 2, max: 100 }).withMessage("Room name required"),
        (0, express_validator_1.body)("pricePerNight").isFloat({ min: 1 }).withMessage("Price must be positive"),
        (0, express_validator_1.body)("maxGuests").isInt({ min: 1, max: 20 }).withMessage("Max guests must be 1–20"),
        (0, express_validator_1.body)("totalUnits").optional().isInt({ min: 1, max: 500 }).withMessage("Total units must be 1–500"),
        (0, express_validator_1.body)("bedType").optional().trim(),
        (0, express_validator_1.body)("roomSize").optional().trim(),
    ],
    updateRoomType: [
        (0, express_validator_1.body)("name").optional().trim().isLength({ min: 2, max: 100 }),
        (0, express_validator_1.body)("pricePerNight").optional().isFloat({ min: 1 }),
        (0, express_validator_1.body)("maxGuests").optional().isInt({ min: 1, max: 20 }),
        (0, express_validator_1.body)("totalUnits").optional().isInt({ min: 1, max: 500 }),
        (0, express_validator_1.body)("bedType").optional().trim(),
        (0, express_validator_1.body)("roomSize").optional().trim(),
    ],
};
//# sourceMappingURL=hotelValidation.js.map