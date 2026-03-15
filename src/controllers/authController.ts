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
};
