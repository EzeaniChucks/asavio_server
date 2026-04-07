"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/supportRouter.ts
const express_1 = require("express");
const supportController_1 = require("../controllers/supportController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.post("/", supportController_1.supportController.createTicket);
router.get("/", supportController_1.supportController.getMyTickets);
router.get("/:id", supportController_1.supportController.getMyTicket);
exports.default = router;
//# sourceMappingURL=supportRouter.js.map