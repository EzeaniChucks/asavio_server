// src/routers/userRouter.ts
import express from "express";
import { hostProfileController } from "../controllers/hostProfileController";
import { protect, restrictTo } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = express.Router();

router.use(protect);

// Photo upload — all authenticated users
router.post("/profile/photo", upload.single("profileImage"), hostProfileController.uploadProfilePhoto);

// Host-only profile fields (bio, languages, occupation, etc.)
router.patch("/profile", restrictTo("host", "admin"), hostProfileController.updateProfile);

export default router;
