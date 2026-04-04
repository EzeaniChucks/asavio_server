// src/entities/Subscription.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "./User";
import { SubscriptionTier, BillingCycle } from "../constants/subscriptionTiers";

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";

@Entity("subscriptions")
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  hostId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hostId" })
  host: User;

  @Column({
    type: "enum",
    enum: ["starter", "pro", "elite"],
    default: "starter",
  })
  tier: SubscriptionTier;

  @Column({
    type: "enum",
    enum: ["monthly", "annual"],
    default: "monthly",
  })
  billingCycle: BillingCycle;

  @Column({
    type: "enum",
    enum: ["active", "cancelled", "expired", "past_due"],
    default: "active",
  })
  status: SubscriptionStatus;

  /** Paystack subscription code — used to cancel/manage via Paystack API */
  @Column({ type: "varchar", nullable: true })
  paystackSubscriptionCode: string | null;

  /** Paystack customer code */
  @Column({ type: "varchar", nullable: true })
  paystackCustomerCode: string | null;

  /** Paystack plan code used for this subscription */
  @Column({ type: "varchar", nullable: true })
  paystackPlanCode: string | null;

  /** Paystack email token — used for the manage subscription link */
  @Column({ type: "varchar", nullable: true })
  paystackEmailToken: string | null;

  @Column({ type: "timestamptz" })
  currentPeriodStart: Date;

  @Column({ type: "timestamptz" })
  currentPeriodEnd: Date;

  @Column({ type: "timestamptz", nullable: true })
  cancelledAt: Date | null;

  @Column({ type: "text", nullable: true })
  cancellationReason: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
