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
  })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @Column()
  propertyId: string;

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

  @Column({ nullable: true })
  specialRequests: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
