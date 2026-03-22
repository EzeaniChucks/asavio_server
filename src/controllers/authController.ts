// src/controllers/authController.ts
import { Request, Response } from "express";
import { AuthService } from "../services/authServices";
import { catchAsync } from "../utils/catchAsync";

const authService = new AuthService();

export const authController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await authService.register(req.body);

    res.status(201).json({
      status: "success",
      token,
      data: { user },
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const { user, token } = await authService.login(req.body);

    res.status(200).json({
      status: "success",
      token,
      data: { user },
    });
  }),

  getMe: catchAsync(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user.id);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  }),

  updateMe: catchAsync(async (req: Request, res: Response) => {
    const user = await authService.updateProfile(req.user.id, req.body);

    res.status(200).json({
      status: "success",
      data: { user },
    });
  }),

  forgotPassword: catchAsync(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.status(200).json({
      status: "success",
      message: "If that email is registered, a reset link has been sent.",
    });
  }),

  resetPassword: catchAsync(async (req: Request, res: Response) => {
    await authService.resetPassword(req.params.token as string, req.body.password);
    res.status(200).json({
      status: "success",
      message: "Password updated successfully. You can now log in.",
    });
  }),

  changePassword: catchAsync(async (req: Request, res: Response) => {
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ status: "success", message: "Password changed." });
  }),

  changeEmail: catchAsync(async (req: Request, res: Response) => {
    const user = await authService.changeEmail(req.user.id, req.body.password, req.body.newEmail);
    res.status(200).json({ status: "success", data: { user } });
  }),
};
