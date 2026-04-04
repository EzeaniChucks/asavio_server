// src/routers/userRouter.ts
import express from "express";
import { hostProfileController } from "../controllers/hostProfileController";
import { protect, restrictTo } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

router.use(protect);
router.use(restrictTo("host", "admin"));

router.patch("/profile", hostProfileController.updateProfile);
router.post("/profile/photo", upload.single("profileImage"), hostProfileController.uploadProfilePhoto);

export default router;
