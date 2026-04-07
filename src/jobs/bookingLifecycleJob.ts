// src/jobs/bookingLifecycleJob.ts
//
// Runs on a schedule to:
//   1. Transition confirmed bookings to "completed" when checkOut has passed.
//   2. Send check-in instructions to guests whose check-in is tomorrow.
//   3. Send a review nudge email to guests whose booking just completed.
//
import cron from "node-cron";
import { AppDataSource } from "../config/database";
import { Booking } from "../entities/Booking";
import { emailService } from "../services/emailService";

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function tomorrowUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// ── Job logic ────────────────────────────────────────────────────────────────

async function completeExpiredBookings(): Promise<void> {
  const repo = AppDataSource.getRepository(Booking);
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

      const listingTitle =
        booking.property?.title ??
        (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");
      const listingId = booking.propertyId ?? booking.vehicleId ?? "";
      const listingType = booking.propertyId ? "property" : "vehicle";

      // Review nudge
      emailService
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
    } catch (err) {
      console.error(`[Lifecycle] Failed to complete booking ${booking.id}:`, err);
    }
  }
}

async function sendCheckInReminders(): Promise<void> {
  const repo = AppDataSource.getRepository(Booking);
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
    if (!instructions) continue;

    const listingTitle =
      booking.property?.title ??
      (booking.vehicle ? `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}` : "your booking");

    try {
      await emailService.sendCheckInInstructions({
        to: booking.user.email,
        firstName: booking.user.firstName,
        listingTitle,
        checkIn: new Date(booking.checkIn).toLocaleDateString("en-GB", { dateStyle: "long" }),
        checkOut: new Date(booking.checkOut).toLocaleDateString("en-GB", { dateStyle: "long" }),
        instructions,
        bookingId: booking.id,
      });
      console.log(`[Lifecycle] Check-in instructions sent for booking ${booking.id}`);
    } catch (err) {
      console.error(`[Lifecycle] Check-in email failed for booking ${booking.id}:`, err);
    }
  }
}

async function cancelAbandonedBookings(): Promise<void> {
  const repo = AppDataSource.getRepository(Booking);
  const cutoff = new Date(Date.now() - 45 * 60 * 1000);

  // awaiting_payment + never paid + created more than 45 minutes ago = abandoned
  const abandoned = await repo
    .createQueryBuilder("b")
    .where("b.status = :status", { status: "awaiting_payment" })
    .andWhere("b.paymentStatus = :pStatus", { pStatus: "pending" })
    .andWhere("b.createdAt < :cutoff", { cutoff })
    .getMany();

  for (const booking of abandoned) {
    try {
      await repo.update(booking.id, { status: "cancelled" });
      console.log(`[Lifecycle] Cancelled abandoned booking ${booking.id} (created ${booking.createdAt.toISOString()})`);
    } catch (err) {
      console.error(`[Lifecycle] Failed to cancel abandoned booking ${booking.id}:`, err);
    }
  }

  if (abandoned.length > 0) {
    console.log(`[Lifecycle] Cancelled ${abandoned.length} abandoned booking(s)`);
  }
}

// ── Scheduler ────────────────────────────────────────────────────────────────

export function startBookingLifecycleJob(): void {
  // Runs every day at 01:00 UTC
  cron.schedule("0 1 * * *", async () => {
    console.log("[Lifecycle] Running daily booking lifecycle job…");
    await completeExpiredBookings();
    await sendCheckInReminders();
    console.log("[Lifecycle] Daily job done.");
  });

  // Runs every 15 minutes — cleans up abandoned unpaid bookings to free the calendar
  cron.schedule("*/15 * * * *", async () => {
    await cancelAbandonedBookings();
  });

  console.log("[Lifecycle] Booking lifecycle jobs scheduled (daily at 01:00 UTC + abandoned cleanup every 15 min)");
}
