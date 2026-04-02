// src/entities/Property.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
  } from "typeorm";
  import { User } from "./User";
  import { Booking } from "./Booking";
  import { Review } from "./Review";
  import { Image } from "./Image";
  
  @Entity("properties")
  export class Property {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column()
    title: string;
  
    @Column("text")
    description: string;
  
    @Column()
    propertyType: string;
  
    @Column()
    bedrooms: number;
  
    @Column()
    bathrooms: number;
  
    @Column()
    maxGuests: number;
  
    /** Default/base price per night — used when no purpose-specific price applies */
    @Column("decimal", { precision: 10, scale: 2 })
    pricePerNight: number;

    /**
     * Optional per-purpose pricing map, e.g.:
     * { "Birthday party": 75000, "House party": 100000 }
     * Null = no purpose-based pricing; single price for all purposes.
     */
    @Column("jsonb", { nullable: true })
    purposePricing: Record<string, number> | null;
  
    @Column("jsonb")
    amenities: string[];
  
    @Column("jsonb")
    location: {
      address: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
      latitude: number;
      longitude: number;
    };
  
    @Column({ default: true })
    isAvailable: boolean;

    /**
     * Host-managed blocked date ranges.
     * Each entry blocks the property from {from} (inclusive) to {to} (exclusive).
     * e.g. [{ "from": "2025-06-01", "to": "2025-06-05" }]
     */
    @Column({ type: "jsonb", nullable: true, default: () => "'[]'" })
    blockedDates: { from: string; to: string }[] | null;

    @Column({
      type: "enum",
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    })
    status: string;

    @Column({ type: "text", nullable: true })
    rejectionReason?: string;

    /** Private check-in instructions sent to the guest 24 h before arrival. */
    @Column({ type: "text", nullable: true })
    checkInInstructions?: string;
  
    @ManyToOne(() => User, (user) => user.properties)
    @JoinColumn({ name: "hostId" })
    host: User;
  
    @Column()
    hostId: string;
  
    @OneToMany(() => Image, (image) => image.property)
    images: Image[];
  
    @OneToMany(() => Booking, (booking) => booking.property)
    bookings: Booking[];
  
    @OneToMany(() => Review, (review) => review.property)
    reviews: Review[];
  
    @Column("float", { default: 0 })
    averageRating: number;
  
    @Column({ default: 0 })
    totalReviews: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }