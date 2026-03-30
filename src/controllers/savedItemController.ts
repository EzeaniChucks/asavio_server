// src/controllers/savedItemController.ts
import { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import { savedItemService } from "../services/savedItemService";

export const savedItemController = {
  toggle: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id as string;
    const { propertyId, vehicleId } = req.body;
    const result = await savedItemService.toggle(userId, propertyId, vehicleId);
    res.json({ status: "success", data: result });
  }),

  getSavedProperties: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 20);
    const result = await savedItemService.getSavedProperties(userId, page, limit);
    res.json({ status: "success", data: result });
  }),

  getSavedIds: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id as string;
    const ids = await savedItemService.getSavedIds(userId);
    res.json({ status: "success", data: ids });
  }),
};
