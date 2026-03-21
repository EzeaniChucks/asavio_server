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
    const items = await savedItemService.getSavedProperties(userId);
    res.json({ status: "success", data: { items } });
  }),

  getSavedIds: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id as string;
    const ids = await savedItemService.getSavedIds(userId);
    res.json({ status: "success", data: ids });
  }),
};
