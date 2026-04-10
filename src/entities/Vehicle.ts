// src/entities/Vehicle.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Booking } from "./Booking";

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  make: string; // e.g. Mercedes

  @Column()
  model: string; // e.g. S-Class

  @Column()
  year: number;

  @Column()
  vehicleType: string; // sedan, SUV, sports, luxury, etc.

  /** Self-drive daily price (always required) */
  @Column("decimal", { precision: 10, scale: 2 })
  pricePerDay: number;

  /** Driver option daily price — null means no driver option available */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  priceWithDriverPerDay: number | null;

  @Column("text")
  description: string;

  @Column("jsonb")
  features: string[]; // e.g. ["GPS", "Bluetooth", "Heated seats"]

  @Column("jsonb")
  images: { url: string; publicId: string }[];

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 1 })
  seats: number;

  @Column({ default: false })
  withDriver: boolean;

  @Column({ default: "pending" })
  status: "pending" | "approved" | "rejected";

  @Column({ type: "text", nullable: true })
  rejectionReason: string | null;

  @Column("float", { default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hostId" })
  host: User;

  @Column()
  hostId: string;

  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];

  /**
   * Cancellation policy for this listing.
   * One of: "flexible" | "moderate" | "firm" | "strict"
   * Default: "flexible"
   */
  @Column({ default: "flexible" })
  cancellationPolicy: string;

  // ── Travel zone ──────────────────────────────────────────────────────────

  /**
   * The base zone this vehicle operates within (e.g. "Lagos", "Abuja").
   * Guests booking within this zone pay the base pricePerDay.
   */
  @Column({ default: "Lagos" })
  travelZone: string;

  /** Whether guests may take this vehicle on interstate trips */
  @Column({ default: false })
  allowInterstate: boolean;

  /**
   * Additional charge per day for interstate travel.
   * Null means no surcharge even if allowInterstate is true.
   */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  interstateSurchargePerDay: number | null;

  /**
   * Host-blocked date ranges — guests cannot book dates that fall within any of these.
   * Format: [{ from: "YYYY-MM-DD", to: "YYYY-MM-DD" }]  (to is exclusive)
   */
  @Column("jsonb", { default: [] })
  blockedDates: { from: string; to: string }[];

  /** Private check-in/pickup instructions sent to the guest 24 h before pickup. */
  @Column({ type: "text", nullable: true })
  checkInInstructions?: string;

  // ── Caution fee (advisory — collected by host offline) ───────────────────

  /** Optional refundable caution fee amount displayed to guests. Not processed by Asavio. */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  cautionFee: number | null;

  // ── Feature video (Pro/Elite tier only) ─────────────────────────────────

  /** Cloudinary secure URL of the feature video, if uploaded */
  @Column({ type: "text", nullable: true })
  featureVideoUrl: string | null;

  /** Cloudinary public_id of the feature video, for deletion */
  @Column({ type: "varchar", nullable: true })
  featureVideoPublicId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
