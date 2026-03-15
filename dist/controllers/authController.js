"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const authServices_1 = require("../services/authServices");
const catchAsync_1 = require("../utils/catchAsync");
const authService = new authServices_1.AuthService();
exports.authController = {
    register: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user, token } = await authService.register(req.body);
        res.status(201).json({
            status: "success",
            token,
            data: { user },
        });
    }),
    login: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { user, token } = await authService.login(req.body);
        res.status(200).json({
            status: "success",
            token,
            data: { user },
        });
    }),
    getMe: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await authService.getProfile(req.user.id);
        res.status(200).json({
            status: "success",
            data: { user },
        });
    }),
    updateMe: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await authService.updateProfile(req.user.id, req.body);
        res.status(200).json({
            status: "success",
            data: { user },
        });
    }),
};
//# sourceMappingURL=authController.js.map