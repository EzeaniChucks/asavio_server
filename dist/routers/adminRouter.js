"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routers/adminRouter.ts
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const permissions_1 = require("../constants/permissions");
const validation_1 = require("../middleware/validation");
const adminValidation_1 = require("../validations/adminValidation");
const router = (0, express_1.Router)();
// All admin routes require authentication + admin role
router.use(auth_1.protect, (0, auth_1.restrictTo)("admin"));
// Overview stats (all admins can see the dashboard)
router.get("/stats", adminController_1.adminController.getStats);
// Users
router.get("/users", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_USERS), adminController_1.adminController.getUsers);
router.patch("/users/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_USERS), adminController_1.adminController.updateUser);
router.delete("/users/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_USERS), adminController_1.adminController.deleteUser);
router.get("/users/:id/properties", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_USERS), adminController_1.adminController.getHostProperties);
router.patch("/users/:id/commission", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_PAYOUTS), (0, validation_1.validate)(adminValidation_1.adminValidation.setHostCommission), adminController_1.adminController.setHostCommissionRate);
// Properties
router.get("/properties", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_PROPERTIES), adminController_1.adminController.getProperties);
router.patch("/properties/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_PROPERTIES), adminController_1.adminController.updateProperty);
router.delete("/properties/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_PROPERTIES), adminController_1.adminController.deleteProperty);
// Vehicles
router.get("/vehicles", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_VEHICLES), adminController_1.adminController.getVehicles);
router.patch("/vehicles/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_VEHICLES), adminController_1.adminController.updateVehicle);
router.delete("/vehicles/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_VEHICLES), adminController_1.adminController.deleteVehicle);
// Bookings
router.get("/bookings", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_BOOKINGS), adminController_1.adminController.getBookings);
router.patch("/bookings/:id/status", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_BOOKINGS), adminController_1.adminController.updateBookingStatus);
// Reviews
router.delete("/reviews/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_REVIEWS), adminController_1.adminController.deleteReview);
// Email broadcast
router.post("/email/broadcast", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_MARKETING), adminController_1.adminController.sendBroadcast);
router.get("/email/audience-count", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_MARKETING), adminController_1.adminController.previewAudienceCount);
router.post("/email/direct", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_USERS), adminController_1.adminController.sendDirectEmail);
// Platform settings
router.get("/settings", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_SETTINGS), adminController_1.adminController.getSettings);
router.patch("/settings", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_SETTINGS), (0, validation_1.validate)(adminValidation_1.adminValidation.updateSettings), adminController_1.adminController.updateSettings);
// IAM — sub-admin management (super-admin or manage_admins permission required)
router.get("/iam/admins", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_ADMINS), adminController_1.adminController.listAdmins);
router.post("/iam/admins", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_ADMINS), (0, validation_1.validate)(adminValidation_1.adminValidation.createAdmin), adminController_1.adminController.createAdmin);
router.patch("/iam/admins/:id/permissions", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_ADMINS), (0, validation_1.validate)(adminValidation_1.adminValidation.updateAdminPermissions), adminController_1.adminController.updateAdminPermissions);
router.delete("/iam/admins/:id", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.MANAGE_ADMINS), adminController_1.adminController.revokeAdmin);
// Audit logs
router.get("/audit-logs", (0, auth_1.hasPermission)(permissions_1.ADMIN_PERMISSIONS.VIEW_AUDIT_LOGS), adminController_1.adminController.getAuditLogs);
exports.default = router;
//# sourceMappingURL=adminRouter.js.map