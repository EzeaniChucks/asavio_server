// src/entities/EventBooking.ts
// Separate from `bookings` because event bookings use time-slots on a single date,
// not date ranges with nights. Shares the same payment + cancellation patterns.

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { EventCenter } from "./EventCenter";
import { EventSpace } from "./EventSpace";

export type EventBookingStatus = "awaiting_payment" | "confirmed" | "cancelled" | "completed";
export type EventPaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type EventPayoutStatus = "pending" | "processing" | "transferred" | "failed";

@Entity("event_bookings")
export class EventBooking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => EventCenter, { onDelete: "CASCADE" })
  @JoinColumn({ name: "eventCenterId" })
  eventCenter: EventCenter;

  @Column()
  eventCenterId: string;

  @ManyToOne(() => EventSpace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "eventSpaceId" })
  eventSpace: EventSpace;

  @Column()
  eventSpaceId: string;

  /** The date of the event (single date, not a range) */
  @Column({ type: "date" })
  eventDate: Date;

  /** Event start time (HH:MM, 24-hour) */
  @Column({ type: "time" })
  startTime: string;

  /** Event end time (HH:MM, 24-hour) */
  @Column({ type: "time" })
  endTime: string;

  /** What kind of event (e.g. "wedding", "corporate", "birthday") */
  @Column()
  eventType: string;

  /** Number of expected attendees (capped at space.capacity) */
  @Column({ type: "int" })
  attendeeCount: number;

  /** Which pricing mode was used to calculate ("hourly", "daily", or "package") */
  @Column({ type: "varchar" })
  pricingUsed: "hourly" | "daily" | "package";

  @Column("decimal", { precision: 10, scale: 2 })
  totalPrice: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  platformCommission: number;

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  hostPayout: number;

  @Column("decimal", { precision: 5, scale: 4, nullable: true })
  appliedCommissionRate: number | null;

  @Column({ length: 3, default: "NGN" })
  currency: string;

  @Column({
    type: "enum",
    enum: ["awaiting_payment", "confirmed", "cancelled", "completed"],
    default: "awaiting_payment",
  })
  status: EventBookingStatus;

  @Column({ default: "paystack" })
  paymentMethod: string;

  @Column({
    type: "enum",
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  })
  paymentStatus: EventPaymentStatus;

  @Column({ nullable: true })
  paystackReference: string;

  @Column({
    type: "enum",
    enum: ["pending", "processing", "transferred", "failed"],
    default: "pending",
  })
  hostPayoutStatus: EventPayoutStatus;

  @Column({ nullable: true })
  payoutReference: string;

  @Column({ type: "text", nullable: true })
  specialRequests: string | null;

  // ── Cancellation ────────────────────────────────────────────────

  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  refundedAmount: number | null;

  @Column({ type: "timestamptz", nullable: true })
  cancelledAt: Date | null;

  @Column({ type: "varchar", length: 10, nullable: true })
  cancelledBy: "guest" | "host" | "admin" | null;

  @Column({ type: "text", nullable: true })
  cancellationReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
