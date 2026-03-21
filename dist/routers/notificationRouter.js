"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/notificationRouter.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.get("/", notificationController_1.notificationController.list);
router.get("/unread-count", notificationController_1.notificationController.unreadCount);
router.patch("/read-all", notificationController_1.notificationController.markAllRead);
router.patch("/:id/read", notificationController_1.notificationController.markRead);
exports.default = router;
//# sourceMappingURL=notificationRouter.js.map