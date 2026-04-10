// src/entities/Booking.ts
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
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";

export type BookingStatus =
  | "awaiting_payment"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type HostPayoutStatus = "pending" | "processing" | "transferred" | "failed";

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Property, (property) => property.bookings, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "propertyId" })
  property: Property | null;

  @Column({ nullable: true })
  propertyId: string | null;

  @ManyToOne(() => Vehicle, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle | null;

  @Column({ nullable: true })
  vehicleId: string | null;

  @Column({ type: "date" })
  checkIn: Date;

  @Column({ type: "date" })
  checkOut: Date;

  @Column({ type: "int" })
  guests: number;

  @Column("decimal", { precision: 10, scale: 2 })
  totalPrice: number;

  // Platform commission deducted from host payout (e.g. 10%)
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  platformCommission: number;

  // Amount that will be / has been transferred to the host
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  hostPayout: number;

  /** Commission rate actually applied at booking creation time (for audit trail) */
  @Column("decimal", { precision: 5, scale: 4, nullable: true })
  appliedCommissionRate: number | null;

  @Column({
    type: "enum",
    enum: ["awaiting_payment", "confirmed", "cancelled", "completed"],
    default: "awaiting_payment",
  })
  status: BookingStatus;

  // All payments go through Paystack only
  @Column({ default: "paystack" })
  paymentMethod: string;

  @Column({
    type: "enum",
    enum: ["pending", "paid", "failed", "refunded"],
    default: "pending",
  })
  paymentStatus: PaymentStatus;

  @Column({ nullable: true })
  paystackReference: string;

  @Column({
    type: "enum",
    enum: ["pending", "processing", "transferred", "failed"],
    default: "pending",
  })
  hostPayoutStatus: HostPayoutStatus;

  @Column({ nullable: true })
  payoutReference: string; // Paystack transfer code

  @Column({ type: "text", nullable: true })
  paymentNotes: string;

  /**
   * ISO 4217 currency code for this booking (e.g. "NGN", "USD", "GBP").
   * Defaults to "NGN". When international markets are added, set this at booking
   * creation time based on the property's market / guest's preference.
   * All monetary fields (totalPrice, platformCommission, hostPayout) are stored
   * in this currency. Use this field everywhere you format or display amounts.
   */
  @Column({ length: 3, default: "NGN" })
  currency: string;

  /** Purpose of the booking — used for purpose-based pricing (e.g. "Birthday party") */
  @Column({ nullable: true })
  purpose: string;

  @Column({ nullable: true })
  specialRequests: string;

  // ── Cancellation tracking ────────────────────────────────────────────────

  /** Amount refunded to the guest when the booking was cancelled (null = no refund yet) */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  refundedAmount: number | null;

  /** When the booking was cancelled */
  @Column({ type: "timestamptz", nullable: true })
  cancelledAt: Date | null;

  /** Who initiated the cancellation: "guest" | "host" | "admin" */
  @Column({ type: "varchar", length: 10, nullable: true })
  cancelledBy: "guest" | "host" | "admin" | null;

  /** Optional free-text reason for cancellation */
  @Column({ type: "text", nullable: true })
  cancellationReason: string | null;

  // ── Vehicle travel scope ─────────────────────────────────────────────────

  /** "local" = within the vehicle's travelZone; "interstate" = cross-state travel */
  @Column({ type: "varchar", length: 20, nullable: true })
  travelScope: "local" | "interstate" | null;

  /** Guest-declared destination for interstate trips (free text) */
  @Column({ type: "varchar", length: 200, nullable: true })
  destination: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
