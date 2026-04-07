// src/controllers/supportController.ts
import { Request, Response, NextFunction } from "express";
import { supportService } from "../services/supportService";
import { catchAsync } from "../utils/catchAsync";

export const supportController = {
  // ── Guest ─────────────────────────────────────────────────────────────────

  createTicket: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const { subject, category, message } = req.body;
    if (!subject || !message) {
      res.status(400).json({ status: "error", message: "subject and message are required" });
      return;
    }
    const ticket = await supportService.createTicket(req.user!.id, { subject, category: category ?? "other", message });
    res.status(201).json({ status: "success", data: { ticket } });
  }),

  getMyTickets: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const tickets = await supportService.getMyTickets(req.user!.id);
    res.json({ status: "success", data: { tickets } });
  }),

  getMyTicket: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const ticket = await supportService.getMyTicket(req.user!.id, req.params.id as string);
    res.json({ status: "success", data: { ticket } });
  }),
};
