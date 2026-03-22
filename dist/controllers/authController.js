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
    forgotPassword: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await authService.forgotPassword(req.body.email);
        res.status(200).json({
            status: "success",
            message: "If that email is registered, a reset link has been sent.",
        });
    }),
    resetPassword: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await authService.resetPassword(req.params.token, req.body.password);
        res.status(200).json({
            status: "success",
            message: "Password updated successfully. You can now log in.",
        });
    }),
    changePassword: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
        res.status(200).json({ status: "success", message: "Password changed." });
    }),
    changeEmail: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const user = await authService.changeEmail(req.user.id, req.body.password, req.body.newEmail);
        res.status(200).json({ status: "success", data: { user } });
    }),
};
//# sourceMappingURL=authController.js.map