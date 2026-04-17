"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/eventCenterRouter.ts
const express_1 = require("express");
const eventCenterController_1 = require("../controllers/eventCenterController");
const auth_1 = require("../middleware/auth");
const requireKyc_1 = require("../middleware/requireKyc");
const upload_1 = require("../middleware/upload");
const validation_1 = require("../middleware/validation");
const eventCenterValidation_1 = require("../validations/eventCenterValidation");
const router = (0, express_1.Router)();
// ── Public ────────────────────────────────────────────────────────────
router.get("/", eventCenterController_1.eventCenterController.listEventCenters);
router.get("/:id", eventCenterController_1.eventCenterController.getEventCenter);
// ── Protected ─────────────────────────────────────────────────────────
router.use(auth_1.protect);
router.get("/host/my", (0, auth_1.restrictTo)("host", "admin"), eventCenterController_1.eventCenterController.getMyEventCenters);
router.post("/", (0, auth_1.restrictTo)("host", "admin"), requireKyc_1.requireKyc, upload_1.upload.array("images", 20), (0, validation_1.validate)(eventCenterValidation_1.eventCenterValidation.create), eventCenterController_1.eventCenterController.createEventCenter);
router.patch("/:id", (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 20), (0, validation_1.validate)(eventCenterValidation_1.eventCenterValidation.update), eventCenterController_1.eventCenterController.updateEventCenter);
router.delete("/:id", (0, auth_1.restrictTo)("host", "admin"), eventCenterController_1.eventCenterController.deleteEventCenter);
router.patch("/:id/toggle-availability", (0, auth_1.restrictTo)("host", "admin"), eventCenterController_1.eventCenterController.toggleAvailability);
// Spaces
router.post("/:id/spaces", (0, auth_1.restrictTo)("host", "admin"), requireKyc_1.requireKyc, upload_1.upload.array("images", 10), (0, validation_1.validate)(eventCenterValidation_1.eventCenterValidation.createSpace), eventCenterController_1.eventCenterController.createSpace);
router.patch("/:id/spaces/:spaceId", (0, auth_1.restrictTo)("host", "admin"), upload_1.upload.array("images", 10), (0, validation_1.validate)(eventCenterValidation_1.eventCenterValidation.updateSpace), eventCenterController_1.eventCenterController.updateSpace);
router.delete("/:id/spaces/:spaceId", (0, auth_1.restrictTo)("host", "admin"), eventCenterController_1.eventCenterController.deleteSpace);
exports.default = router;
//# sourceMappingURL=eventCenterRouter.js.map