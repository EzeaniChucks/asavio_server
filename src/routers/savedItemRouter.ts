// src/routers/savedItemRouter.ts
import { Router } from "express";
import { protect } from "../middleware/auth";
import { savedItemController } from "../controllers/savedItemController";

const router = Router();

router.use(protect);

router.post("/toggle", savedItemController.toggle);
router.get("/", savedItemController.getSavedProperties);
router.get("/ids", savedItemController.getSavedIds);

export default router;
