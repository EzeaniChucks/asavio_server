// src/routers/adminRouter.ts
import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { protect, restrictTo, hasPermission } from "../middleware/auth";
import { ADMIN_PERMISSIONS as P } from "../constants/permissions";
import { validate } from "../middleware/validation";
import { adminValidation } from "../validations/adminValidation";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, restrictTo("admin"));

// Overview stats (all admins can see the dashboard)
router.get("/stats", adminController.getStats);

// Users
router.get("/users",             hasPermission(P.MANAGE_USERS), adminController.getUsers);
router.get("/users/:id",         hasPermission(P.MANAGE_USERS), adminController.getUser);
router.patch("/users/:id",       hasPermission(P.MANAGE_USERS), adminController.updateUser);
router.delete("/users/:id",      hasPermission(P.MANAGE_USERS), adminController.deleteUser);
router.get("/users/:id/properties", hasPermission(P.MANAGE_USERS), adminController.getHostProperties);
router.patch("/users/:id/commission", hasPermission(P.MANAGE_PAYOUTS), validate(adminValidation.setHostCommission), adminController.setHostCommissionRate);

// Properties
router.get("/properties",        hasPermission(P.MANAGE_PROPERTIES), adminController.getProperties);
router.patch("/properties/:id",  hasPermission(P.MANAGE_PROPERTIES), adminController.updateProperty);
router.delete("/properties/:id", hasPermission(P.MANAGE_PROPERTIES), adminController.deleteProperty);

// Vehicles
router.get("/vehicles",          hasPermission(P.MANAGE_VEHICLES), adminController.getVehicles);
router.patch("/vehicles/:id",    hasPermission(P.MANAGE_VEHICLES), adminController.updateVehicle);
router.delete("/vehicles/:id",   hasPermission(P.MANAGE_VEHICLES), adminController.deleteVehicle);

// Bookings
router.get("/bookings",                       hasPermission(P.MANAGE_BOOKINGS), adminController.getBookings);
router.patch("/bookings/:id/status",          hasPermission(P.MANAGE_BOOKINGS), adminController.updateBookingStatus);
router.post("/bookings/:id/verify-payment",   hasPermission(P.MANAGE_BOOKINGS), adminController.verifyBookingPayment);

// Support Tickets
router.get("/support",             hasPermission(P.MANAGE_SUPPORT), adminController.getSupportTickets);
router.get("/support/:id",         hasPermission(P.MANAGE_SUPPORT), adminController.getSupportTicket);
router.post("/support/:id/respond",hasPermission(P.MANAGE_SUPPORT), adminController.respondToSupportTicket);
router.patch("/support/:id/status",hasPermission(P.MANAGE_SUPPORT), adminController.updateSupportTicketStatus);

// Reviews
router.delete("/reviews/:id",    hasPermission(P.MANAGE_REVIEWS), adminController.deleteReview);

// Email broadcast
router.post("/email/broadcast",        hasPermission(P.MANAGE_MARKETING), adminController.sendBroadcast);
router.get("/email/audience-count",    hasPermission(P.MANAGE_MARKETING), adminController.previewAudienceCount);
router.post("/email/direct",           hasPermission(P.MANAGE_USERS),     adminController.sendDirectEmail);

// Platform settings
router.get("/settings",          hasPermission(P.MANAGE_SETTINGS), adminController.getSettings);
router.patch("/settings",        hasPermission(P.MANAGE_SETTINGS), validate(adminValidation.updateSettings), adminController.updateSettings);

// IAM — sub-admin management (super-admin or manage_admins permission required)
router.get("/iam/admins",                        hasPermission(P.MANAGE_ADMINS), adminController.listAdmins);
router.post("/iam/admins",                       hasPermission(P.MANAGE_ADMINS), validate(adminValidation.createAdmin), adminController.createAdmin);
router.patch("/iam/admins/:id/permissions",      hasPermission(P.MANAGE_ADMINS), validate(adminValidation.updateAdminPermissions), adminController.updateAdminPermissions);
router.delete("/iam/admins/:id",                 hasPermission(P.MANAGE_ADMINS), adminController.revokeAdmin);

// Audit logs
router.get("/audit-logs",        hasPermission(P.VIEW_AUDIT_LOGS), adminController.getAuditLogs);

export default router;
