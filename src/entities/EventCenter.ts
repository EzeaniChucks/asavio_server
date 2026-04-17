// src/entities/EventCenter.ts
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
import { EventSpace } from "./EventSpace";
import { EventCenterImage } from "./EventCenterImage";

@Entity("event_centers")
export class EventCenter {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column("text")
  description: string;

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

  /** Venue-wide amenities (AV, stage, parking, catering kitchen, AC) */
  @Column("jsonb", { default: [] })
  amenities: string[];

  /** Places of interest nearby */
  @Column("jsonb", { nullable: true })
  nearbyPlaces: string[] | null;

  /**
   * Event types the host allows at this venue.
   * e.g. ["wedding", "corporate", "birthday", "photoshoot"]
   * Empty array = all types welcome.
   */
  @Column("jsonb", { default: [] })
  allowedEventTypes: string[];

  /**
   * Explicit blocklist — overrides allowedEventTypes even if both are set.
   * e.g. ["political", "nightclub"]
   */
  @Column("jsonb", { default: [] })
  blockedEventTypes: string[];

  @Column({ default: "flexible" })
  cancellationPolicy: string;

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

  @OneToMany(() => EventSpace, (space) => space.eventCenter, { cascade: true })
  spaces: EventSpace[];

  @OneToMany(() => EventCenterImage, (image) => image.eventCenter, { cascade: true })
  images: EventCenterImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
