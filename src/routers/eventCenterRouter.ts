// src/routers/eventCenterRouter.ts
import { Router } from "express";
import { eventCenterController } from "../controllers/eventCenterController";
import { protect, restrictTo } from "../middleware/auth";
import { requireKyc } from "../middleware/requireKyc";
import { upload } from "../middleware/upload";
import { validate } from "../middleware/validation";
import { eventCenterValidation } from "../validations/eventCenterValidation";

const router = Router();

// ── Public ────────────────────────────────────────────────────────────

router.get("/", eventCenterController.listEventCenters);
router.get("/:id", eventCenterController.getEventCenter);

// ── Protected ─────────────────────────────────────────────────────────

router.use(protect);

router.get("/host/my", restrictTo("host", "admin"), eventCenterController.getMyEventCenters);

router.post(
  "/",
  restrictTo("host", "admin"),
  requireKyc,
  upload.array("images", 20),
  validate(eventCenterValidation.create),
  eventCenterController.createEventCenter
);

router.patch(
  "/:id",
  restrictTo("host", "admin"),
  upload.array("images", 20),
  validate(eventCenterValidation.update),
  eventCenterController.updateEventCenter
);

router.delete("/:id", restrictTo("host", "admin"), eventCenterController.deleteEventCenter);

router.patch(
  "/:id/toggle-availability",
  restrictTo("host", "admin"),
  eventCenterController.toggleAvailability
);

// Spaces
router.post(
  "/:id/spaces",
  restrictTo("host", "admin"),
  requireKyc,
  upload.array("images", 10),
  validate(eventCenterValidation.createSpace),
  eventCenterController.createSpace
);

router.patch(
  "/:id/spaces/:spaceId",
  restrictTo("host", "admin"),
  upload.array("images", 10),
  validate(eventCenterValidation.updateSpace),
  eventCenterController.updateSpace
);

router.delete(
  "/:id/spaces/:spaceId",
  restrictTo("host", "admin"),
  eventCenterController.deleteSpace
);

export default router;
