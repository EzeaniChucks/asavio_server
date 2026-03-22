// src/entities/User.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from "typeorm";
  import { Property } from "./Property";
  import { Booking } from "./Booking";
  import { Review } from "./Review";
  
  @Entity("users")
  export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column({ unique: true })
    email: string;
  
    @Column()
    password: string;
  
    @Column()
    firstName: string;
  
    @Column()
    lastName: string;
  
    @Column({ nullable: true })
    phone: string;
  
    @Column({ nullable: true })
    profileImage: string;
  
    @Column({
      type: "enum",
      enum: ["user", "host", "admin"],
      default: "user",
    })
    role: string;
  
    @Column({ default: false })
    isVerified: boolean;

    // Host payout bank details
    @Column({ nullable: true })
    bankAccountNumber: string;

    @Column({ nullable: true })
    bankCode: string;

    @Column({ nullable: true })
    bankAccountName: string; // Paystack-verified name

    @Column({ nullable: true })
    bankName: string; // Human-readable bank name

    @Column({ nullable: true })
    paystackRecipientCode: string; // For transfers

    /** Optional per-host commission rate override (0–1). Null = use global rate. */
    @Column("decimal", { precision: 5, scale: 4, nullable: true })
    commissionRateOverride: number | null;

    // KYC fields
    @Column({
      type: "enum",
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
    })
    kycStatus: "not_submitted" | "pending" | "approved" | "rejected";

    @Column({ nullable: true })
    kycDocumentType: string;

    @Column({ nullable: true })
    kycDocumentUrl: string;

    @Column({ nullable: true })
    kycDocumentPublicId: string;

    @Column({ type: "timestamptz", nullable: true })
    kycSubmittedAt: Date | null;

    @Column({ type: "timestamptz", nullable: true })
    kycReviewedAt: Date | null;

    @Column({ nullable: true })
    kycRejectionReason: string;

    // ── Host trust tier ──────────────────────────────────────────────────────

    /**
     * Computed host tier badge. Recalculated after reviews and chat replies.
     * new_host → trusted_host → top_host
     */
    @Column({
      type: "enum",
      enum: ["new_host", "trusted_host", "top_host"],
      default: "new_host",
    })
    hostTier: "new_host" | "trusted_host" | "top_host";

    /** % of guest-initiated conversations where host replied within 24 h (0–1) */
    @Column("decimal", { precision: 5, scale: 4, default: 0 })
    responseRate: number;

    /** Set on Socket.io disconnect — used for "Last seen X ago" display */
    @Column({ type: "timestamptz", nullable: true })
    lastSeen: Date | null;

    // Password reset
    @Column({ nullable: true, select: false })
    passwordResetToken: string;

    @Column({ type: "timestamptz", nullable: true })
    passwordResetExpires: Date | null;

    @OneToMany(() => Property, (property) => property.host)
    properties: Property[];
  
    @OneToMany(() => Booking, (booking) => booking.user)
    bookings: Booking[];
  
    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }