// src/controllers/paymentController.ts
import { Request, Response, NextFunction } from "express";
import { paymentService } from "../services/paymentService";
import { catchAsync } from "../utils/catchAsync";

export const paymentController = {
  initializePayment: catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { bookingId } = req.body;
      if (!bookingId) {
        res
          .status(400)
          .json({ status: "error", message: "bookingId is required" });
        return;
      }
      const result = await paymentService.initializePayment(
        bookingId,
        req.user!.id
      );
      res.json({ status: "success", data: result });
    }
  ),

  verifyPayment: catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
      const { reference } = req.params;
      const booking = await paymentService.verifyPayment(reference as string, req.user!.id);
      res.json({ status: "success", data: { booking } });
    }
  ),

  webhook: catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
      const signature = req.headers["x-paystack-signature"] as string;
      if (!signature) {
        res.status(400).json({ status: "error", message: "Missing signature" });
        return;
      }
      // rawBody is attached by the express.json verify callback in app.ts
      const rawBody: Buffer = (req as any).rawBody;
      await paymentService.handleWebhook(rawBody, signature);
      res.status(200).json({ status: "success" });
    }
  ),
};
