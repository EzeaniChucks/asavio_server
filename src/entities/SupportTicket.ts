// src/entities/SupportTicket.ts
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

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "payment" | "booking" | "listing" | "account" | "other";

@Entity("support_tickets")
export class SupportTicket {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @Column()
  subject: string;

  @Column({
    type: "enum",
    enum: ["payment", "booking", "listing", "account", "other"],
    default: "other",
  })
  category: TicketCategory;

  @Column("text")
  message: string;

  @Column({
    type: "enum",
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open",
  })
  status: TicketStatus;

  @Column({ type: "text", nullable: true })
  adminResponse: string | null;

  @Column({ type: "timestamptz", nullable: true })
  respondedAt: Date | null;

  @Column({ type: "varchar", nullable: true })
  respondedByAdminId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
