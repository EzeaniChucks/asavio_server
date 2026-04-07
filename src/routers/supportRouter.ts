// src/routers/supportRouter.ts
import { Router } from "express";
import { supportController } from "../controllers/supportController";
import { protect } from "../middleware/auth";

const router = Router();

router.use(protect);

router.post("/", supportController.createTicket);
router.get("/", supportController.getMyTickets);
router.get("/:id", supportController.getMyTicket);

export default router;
