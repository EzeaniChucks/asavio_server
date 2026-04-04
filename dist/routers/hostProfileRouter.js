"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/hostProfileRouter.ts
const express_1 = __importDefault(require("express"));
const hostProfileController_1 = require("../controllers/hostProfileController");
const router = express_1.default.Router();
// Public — anyone can view a host's profile
router.get("/:id", hostProfileController_1.hostProfileController.getPublicProfile);
exports.default = router;
//# sourceMappingURL=hostProfileRouter.js.map