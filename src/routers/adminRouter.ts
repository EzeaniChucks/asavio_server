// src/routers/adminRouter.ts
import { Router } from "express";
import { adminController } from "../controllers/adminController";
import { protect, restrictTo } from "../middleware/auth";

const router = Router();

// All admin routes require authentication + admin role
router.use(protect, restrictTo("admin"));

// Overview stats
router.get("/stats", adminController.getStats);

// Users
router.get("/users", adminController.getUsers);
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUser);

// Properties
router.get("/properties", adminController.getProperties);
router.patch("/properties/:id", adminController.updateProperty);
router.delete("/properties/:id", adminController.deleteProperty);

// Vehicles
router.get("/vehicles", adminController.getVehicles);
router.delete("/vehicles/:id", adminController.deleteVehicle);

// Bookings
router.get("/bookings", adminController.getBookings);
router.patch("/bookings/:id/status", adminController.updateBookingStatus);

// Reviews
router.delete("/reviews/:id", adminController.deleteReview);

// Email broadcast
router.post("/email/broadcast", adminController.sendBroadcast);

export default router;
