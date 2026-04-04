// src/routers/hostProfileRouter.ts
import express from "express";
import { hostProfileController } from "../controllers/hostProfileController";
import { protect, restrictTo } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

// Public — anyone can view a host's profile
router.get("/:id", hostProfileController.getPublicProfile);

export default router;
