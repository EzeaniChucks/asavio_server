"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/conversationRouter.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const conversationController_1 = require("../controllers/conversationController");
const validation_1 = require("../middleware/validation");
const conversationValidation_1 = require("../validations/conversationValidation");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.get("/", conversationController_1.conversationController.list);
router.post("/", (0, validation_1.validate)(conversationValidation_1.conversationValidation.getOrCreate), conversationController_1.conversationController.getOrCreate);
router.get("/unread-count", conversationController_1.conversationController.unreadCount);
router.get("/:id/messages", conversationController_1.conversationController.messages);
exports.default = router;
//# sourceMappingURL=conversationRouter.js.map