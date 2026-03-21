// src/routers/notificationRouter.ts
import { Router } from "express";
import { protect } from "../middleware/auth";
import { notificationController } from "../controllers/notificationController";

const router = Router();
router.use(protect);

router.get("/", notificationController.list);
router.get("/unread-count", notificationController.unreadCount);
router.patch("/read-all", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markRead);

export default router;
