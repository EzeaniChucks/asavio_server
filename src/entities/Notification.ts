// src/entities/Notification.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";

export type NotificationType =
  | "message"
  | "booking_request"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_completed"
  | "review_received"
  | "kyc_approved"
  | "kyc_rejected"
  | "kyc_submitted"
  | "listing_approved"
  | "listing_rejected"
  | "listing_submitted"
  | "payout_transferred"
  | "payout_failed";

@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: [
      "message",
      "booking_request",
      "booking_confirmed",
      "booking_cancelled",
      "booking_completed",
      "review_received",
      "kyc_approved",
      "kyc_rejected",
      "kyc_submitted",
      "listing_approved",
      "listing_rejected",
      "listing_submitted",
      "payout_transferred",
      "payout_failed",
    ],
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column("text")
  body: string;

  /** Extra context — e.g. { conversationId, bookingId, propertyId } */
  @Column({ type: "jsonb", nullable: true })
  data: Record<string, string> | null;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
