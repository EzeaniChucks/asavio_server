"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/userRouter.ts
const express_1 = __importDefault(require("express"));
const hostProfileController_1 = require("../controllers/hostProfileController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = express_1.default.Router();
router.use(auth_1.protect);
// Photo upload — all authenticated users
router.post("/profile/photo", upload_1.upload.single("profileImage"), hostProfileController_1.hostProfileController.uploadProfilePhoto);
// Host-only profile fields (bio, languages, occupation, etc.)
router.patch("/profile", (0, auth_1.restrictTo)("host", "admin"), hostProfileController_1.hostProfileController.updateProfile);
exports.default = router;
//# sourceMappingURL=userRouter.js.map