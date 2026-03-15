// src/controllers/reviewController.ts
import { Request, Response, NextFunction } from "express";
import { reviewService } from "../services/reviewService";
import { catchAsync } from "../utils/catchAsync";

export const reviewController = {
  createReview: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const review = await reviewService.createReview(req.user!.id, req.body);
    res.status(201).json({ status: "success", data: { review } });
  }),

  getPropertyReviews: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const reviews = await reviewService.getPropertyReviews(req.params.propertyId as string);
    res.json({ status: "success", data: { reviews } });
  }),

  getVehicleReviews: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const reviews = await reviewService.getVehicleReviews(req.params.vehicleId as string);
    res.json({ status: "success", data: { reviews } });
  }),

  getAllReviews: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const result = await reviewService.getAllReviews(page, limit);
    res.json({ status: "success", data: result });
  }),

  updateReview: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const review = await reviewService.updateReview(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      req.body
    );
    res.json({ status: "success", data: { review } });
  }),

  deleteReview: catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    await reviewService.deleteReview(
      req.params.id as string,
      req.user!.id,
      req.user!.role
    );
    res.status(204).send();
  }),
};
