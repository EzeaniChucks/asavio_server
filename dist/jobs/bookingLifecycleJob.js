"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBookingLifecycleJob = startBookingLifecycleJob;
// src/jobs/bookingLifecycleJob.ts
//
// Runs on a schedule to:
//   1. Transition confirmed bookings to "completed" when checkOut has passed.
//   2. Send check-in instructions to guests whose check-in is tomorrow.
//   3. Send a review nudge email to guests whose booking just completed.
//
const node_cron_1 = __importDefault(require("node-cron"));
const database_1 = require("../config/database");
const Booking_1 = require("../entities/Booking");
const emailService_1 = require("../services/emailService");
// ── Helpers ─────────────────────────────────────────────────────────────────
function todayUTC() {
    return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}
function tomorrowUTC() {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
}
// ── Job logic ────────────────────────────────────────────────────────────────
async function completeExpiredBookings() {
    const repo = database_1.AppDataSource.getRepository(Booking_1.Booking);
    const today = todayUTC();
    // Find confirmed + paid bookings whose check-out date has passed
    const expired = await repo
        .createQueryBuilder("b")
        .leftJoinAndSelect("b.user", "user")
        .leftJoinAndSelect("b.property", "property")
        .leftJoinAndSelect("b.vehicle", "vehicle")
        .where("b.status = :status", { status: "confirmed" })
        .andWhere("b.paymentStatus = :paid", { paid: "paid" })
        .andWhere("CAST(b.checkOut AS text) < :today", { today })
        .getMany();
    for (const booking of expired) {
        try {
            await repo.update(booking.id, { status: "completed" });
            const listingTitle = booking.property?.title ??
                (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");
            const listingId = booking.propertyId ?? booking.vehicleId ?? "";
            const listingType = booking.propertyId ? "property" : "vehicle";
            // Review nudge
            emailService_1.emailService
                .sendReviewNudge({
                to: booking.user.email,
                firstName: booking.user.firstName,
                listingTitle,
                bookingId: booking.id,
                listingId,
                listingType,
            })
                .catch((err) => console.error(`[Lifecycle] Review nudge failed for booking ${booking.id}:`, err));
            console.log(`[Lifecycle] Completed booking ${booking.id} (${listingTitle})`);
        }
        catch (err) {
            console.error(`[Lifecycle] Failed to complete booking ${booking.id}:`, err);
        }
    }
}
async function sendCheckInReminders() {
    const repo = database_1.AppDataSource.getRepository(Booking_1.Booking);
    const tomorrow = tomorrowUTC();
    const upcoming = await repo
        .createQueryBuilder("b")
        .leftJoinAndSelect("b.user", "user")
        .leftJoinAndSelect("b.property", "property")
        .leftJoinAndSelect("b.vehicle", "vehicle")
        .where("b.status = :status", { status: "confirmed" })
        .andWhere("b.paymentStatus = :paid", { paid: "paid" })
        .andWhere("CAST(b.checkIn AS text) = :tomorrow", { tomorrow })
        .getMany();
    for (const booking of upcoming) {
        const listing = booking.property ?? booking.vehicle;
        const instructions = listing?.checkInInstructions;
        // Only send if the host has written instructions
        if (!instructions)
            continue;
        const listingTitle = booking.property?.title ??
            (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");
        try {
            await emailService_1.emailService.sendCheckInInstructions({
                to: booking.user.email,
                firstName: booking.user.firstName,
                listingTitle,
                checkIn: new Date(booking.checkIn).toLocaleDateString("en-GB", { dateStyle: "long" }),
                checkOut: new Date(booking.checkOut).toLocaleDateString("en-GB", { dateStyle: "long" }),
                instructions,
                bookingId: booking.id,
            });
            console.log(`[Lifecycle] Check-in instructions sent for booking ${booking.id}`);
        }
        catch (err) {
            console.error(`[Lifecycle] Check-in email failed for booking ${booking.id}:`, err);
        }
    }
}
async function cancelAbandonedBookings() {
    const repo = database_1.AppDataSource.getRepository(Booking_1.Booking);
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);
    // Only cancel bookings where the customer never reached Paystack at all
    // (no paystackReference). If a reference exists the customer was redirected
    // to Paystack and may have paid — those need admin review, not auto-cancel.
    const abandoned = await repo
        .createQueryBuilder("b")
        .where("b.status = :status", { status: "awaiting_payment" })
        .andWhere("b.paymentStatus = :pStatus", { pStatus: "pending" })
        .andWhere("b.createdAt < :cutoff", { cutoff })
        .andWhere("b.paystackReference IS NULL")
        .getMany();
    for (const booking of abandoned) {
        try {
            await repo.update(booking.id, { status: "cancelled" });
            console.log(`[Lifecycle] Cancelled abandoned booking ${booking.id} (created ${booking.createdAt.toISOString()})`);
        }
        catch (err) {
            console.error(`[Lifecycle] Failed to cancel abandoned booking ${booking.id}:`, err);
        }
    }
    if (abandoned.length > 0) {
        console.log(`[Lifecycle] Cancelled ${abandoned.length} abandoned booking(s)`);
    }
}
// ── Scheduler ────────────────────────────────────────────────────────────────
function startBookingLifecycleJob() {
    // Runs every day at 01:00 UTC
    node_cron_1.default.schedule("0 1 * * *", async () => {
        console.log("[Lifecycle] Running daily booking lifecycle job…");
        await completeExpiredBookings();
        await sendCheckInReminders();
        console.log("[Lifecycle] Daily job done.");
    });
    // Runs every 15 minutes — cleans up abandoned unpaid bookings to free the calendar
    node_cron_1.default.schedule("*/15 * * * *", async () => {
        await cancelAbandonedBookings();
    });
    console.log("[Lifecycle] Booking lifecycle jobs scheduled (daily at 01:00 UTC + abandoned cleanup every 15 min)");
}
//# sourceMappingURL=bookingLifecycleJob.js.map