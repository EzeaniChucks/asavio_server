"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/kycRouter.ts
const express_1 = require("express");
const kycController_1 = require("../controllers/kycController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Host routes — must be authenticated
router.post("/submit", auth_1.protect, (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.single("document"), kycController_1.kycController.submit);
router.get("/status", auth_1.protect, kycController_1.kycController.getStatus);
// Admin routes
router.get("/", auth_1.protect, (0, auth_1.restrictTo)("admin"), kycController_1.kycController.listAll);
router.patch("/:userId/review", auth_1.protect, (0, auth_1.restrictTo)("admin"), kycController_1.kycController.review);
exports.default = router;
//# sourceMappingURL=kycRouter.js.map