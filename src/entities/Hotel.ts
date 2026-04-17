// src/entities/Hotel.ts
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
import { RoomType } from "./RoomType";
import { HotelImage } from "./HotelImage";

@Entity("hotels")
export class Hotel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column("text")
  description: string;

  /** Sub-category, e.g. "Beach Resort", "City Hotel", "Boutique", "Budget" */
  @Column({ default: "Hotel" })
  hotelType: string;

  /**
   * Host-declared star rating (1-5). Shown to guests with a "verified" flag
   * once admin flips verifiedStarRating = true during moderation.
   */
  @Column({ type: "smallint", nullable: true })
  starRating: number | null;

  @Column({ default: false })
  verifiedStarRating: boolean;

  @Column("jsonb")
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;
  };

  /** Hotel-wide amenities (pool, gym, restaurant, front desk, parking) */
  @Column("jsonb", { default: [] })
  amenities: string[];

  /** Places of interest nearby */
  @Column("jsonb", { nullable: true })
  nearbyPlaces: string[] | null;

  /** Default check-in time (e.g. "14:00") */
  @Column({ type: "varchar", length: 5, default: "14:00" })
  checkInTime: string;

  /** Default check-out time (e.g. "11:00") */
  @Column({ type: "varchar", length: 5, default: "11:00" })
  checkOutTime: string;

  @Column({ default: "flexible" })
  cancellationPolicy: string;

  @Column({ type: "text", nullable: true })
  checkInInstructions?: string;

  @Column({
    type: "enum",
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  })
  status: string;

  @Column({ type: "text", nullable: true })
  rejectionReason?: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column("float", { default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @Column({ default: 0 })
  viewCount: number;

  // ── Feature video (Pro/Elite tier only) ─────────────────────────────────

  @Column({ type: "text", nullable: true })
  featureVideoUrl: string | null;

  @Column({ type: "varchar", nullable: true })
  featureVideoPublicId: string | null;

  // ── Relations ────────────────────────────────────────────────────────────

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hostId" })
  host: User;

  @Column()
  hostId: string;

  @OneToMany(() => RoomType, (room) => room.hotel, { cascade: true })
  roomTypes: RoomType[];

  @OneToMany(() => HotelImage, (image) => image.hotel, { cascade: true })
  images: HotelImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
