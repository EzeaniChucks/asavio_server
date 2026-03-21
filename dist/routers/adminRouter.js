"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/adminRouter.ts
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication + admin role
router.use(auth_1.protect, (0, auth_1.restrictTo)("admin"));
// Overview stats
router.get("/stats", adminController_1.adminController.getStats);
// Users
router.get("/users", adminController_1.adminController.getUsers);
router.patch("/users/:id", adminController_1.adminController.updateUser);
router.delete("/users/:id", adminController_1.adminController.deleteUser);
// Properties
router.get("/properties", adminController_1.adminController.getProperties);
router.patch("/properties/:id", adminController_1.adminController.updateProperty);
router.delete("/properties/:id", adminController_1.adminController.deleteProperty);
// Vehicles
router.get("/vehicles", adminController_1.adminController.getVehicles);
router.delete("/vehicles/:id", adminController_1.adminController.deleteVehicle);
// Bookings
router.get("/bookings", adminController_1.adminController.getBookings);
router.patch("/bookings/:id/status", adminController_1.adminController.updateBookingStatus);
// Reviews
router.delete("/reviews/:id", adminController_1.adminController.deleteReview);
// Email broadcast
router.post("/email/broadcast", adminController_1.adminController.sendBroadcast);
router.get("/email/audience-count", adminController_1.adminController.previewAudienceCount);
// Platform settings (global commission rate)
router.get("/settings", adminController_1.adminController.getSettings);
router.patch("/settings", adminController_1.adminController.updateSettings);
// Host detail (properties listing)
router.get("/users/:id/properties", adminController_1.adminController.getHostProperties);
// Per-host commission rate override
router.patch("/users/:id/commission", adminController_1.adminController.setHostCommissionRate);
exports.default = router;
//# sourceMappingURL=adminRouter.js.map