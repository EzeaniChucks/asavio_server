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
      const booking = await paymentService.verifyPayment(reference as string);
      res.json({ status: "success", data: { booking } });
    }
  ),

  webhook: catchAsync(
    async (req: Request, res: Response, _next: NextFunction) => {
      console.log("[Webhook] Incoming request from Paystack");
      const signature = req.headers["x-paystack-signature"] as string;
      if (!signature) {
        console.warn("[Webhook] Missing x-paystack-signature header — rejected");
        res.status(400).json({ status: "error", message: "Missing signature" });
        return;
      }
      console.log("[Webhook] Signature present:", signature.slice(0, 16) + "...");
      // rawBody is attached by the express.json verify callback in app.ts
      const rawBody: Buffer = (req as any).rawBody;
      console.log("[Webhook] Raw body length:", rawBody?.length ?? "undefined");
      await paymentService.handleWebhook(rawBody, signature);
      console.log("[Webhook] Handled successfully — responding 200");
      res.status(200).json({ status: "success" });
    }
  ),
};
