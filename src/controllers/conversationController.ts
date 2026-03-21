// src/controllers/conversationController.ts
import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { chatService } from "../services/chatService";
import { AppError } from "../utils/AppError";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";

export const conversationController = {
  /** GET /conversations */
  list: catchAsync(async (req: Request, res: Response) => {
    const conversations = await chatService.getConversationsForUser(req.user!.id);
    res.json({ status: "success", data: { conversations } });
  }),

  /** POST /conversations — start or retrieve an existing conversation */
  getOrCreate: catchAsync(async (req: Request, res: Response) => {
    const { hostId, propertyId, vehicleId } = req.body;
    const guestId = req.user!.id;

    if (!hostId) throw new AppError("hostId is required", 400);
    if (guestId === hostId) throw new AppError("You cannot message yourself", 400);

    const host = await AppDataSource.getRepository(User).findOne({ where: { id: hostId } });
    if (!host) throw new AppError("Host not found", 404);

    const conversation = await chatService.getOrCreateConversation({
      guestId,
      hostId,
      propertyId: propertyId ?? null,
      vehicleId: vehicleId ?? null,
    });

    res.json({ status: "success", data: { conversation } });
  }),

  /** GET /conversations/:id/messages */
  messages: catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const limit = Math.min(parseInt((req.query.limit as string) || "50"), 100);
    const before = req.query.before as string | undefined;

    const messages = await chatService.getMessages(id, req.user!.id, limit, before);
    res.json({ status: "success", data: { messages } });
  }),

  /** GET /conversations/unread-count */
  unreadCount: catchAsync(async (req: Request, res: Response) => {
    const count = await chatService.getUnreadCount(req.user!.id);
    res.json({ status: "success", data: { count } });
  }),
};
