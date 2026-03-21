// src/controllers/notificationController.ts
import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { notificationService } from "../services/notificationService";

export const notificationController = {
  /** GET /notifications */
  list: catchAsync(async (req: Request, res: Response) => {
    const unreadOnly = req.query.unread === "true";
    const notifications = await notificationService.getForUser(req.user!.id, unreadOnly);
    res.json({ status: "success", data: { notifications } });
  }),

  /** GET /notifications/unread-count */
  unreadCount: catchAsync(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ status: "success", data: { count } });
  }),

  /** PATCH /notifications/read-all */
  markAllRead: catchAsync(async (req: Request, res: Response) => {
    await notificationService.markAllRead(req.user!.id);
    res.json({ status: "success", data: null });
  }),

  /** PATCH /notifications/:id/read */
  markRead: catchAsync(async (req: Request, res: Response) => {
    await notificationService.markRead(req.params.id as string, req.user!.id);
    res.json({ status: "success", data: null });
  }),
};
