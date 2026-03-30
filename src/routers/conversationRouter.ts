// src/routers/conversationRouter.ts
import { Router } from "express";
import { protect } from "../middleware/auth";
import { conversationController } from "../controllers/conversationController";
import { validate } from "../middleware/validation";
import { conversationValidation } from "../validations/conversationValidation";

const router = Router();
router.use(protect);

router.get("/", conversationController.list);
router.post("/", validate(conversationValidation.getOrCreate), conversationController.getOrCreate);
router.get("/unread-count", conversationController.unreadCount);
router.get("/:id/messages", conversationController.messages);

export default router;
