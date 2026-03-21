"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/savedItemRouter.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const savedItemController_1 = require("../controllers/savedItemController");
const router = (0, express_1.Router)();
router.use(auth_1.protect);
router.post("/toggle", savedItemController_1.savedItemController.toggle);
router.get("/", savedItemController_1.savedItemController.getSavedProperties);
router.get("/ids", savedItemController_1.savedItemController.getSavedIds);
exports.default = router;
//# sourceMappingURL=savedItemRouter.js.map