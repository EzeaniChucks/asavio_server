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