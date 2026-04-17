// src/entities/EventSpace.ts
// A bookable sub-space within an event center (e.g. Main Hall, VIP Lounge, Garden).
// Each space has its own capacity, pricing mode, and availability.

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
import { EventCenter } from "./EventCenter";
import { EventSpaceImage } from "./EventSpaceImage";

@Entity("event_spaces")
export class EventSpace {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column("text", { nullable: true })
  description: string | null;

  /** Maximum attendees this space can hold */
  @Column({ type: "int" })
  capacity: number;

  /**
   * Pricing model:
   * - "hourly": charged per hour (hourlyRate × hours)
   * - "daily": flat daily rate (one event per day locks the space)
   * - "package": fixed package price (includes X hours + description)
   * - "hybrid": host sets both hourly + daily; guest picks
   */
  @Column({ type: "varchar", default: "hourly" })
  pricingMode: "hourly" | "daily" | "package" | "hybrid";

  /** Price per hour (used when pricingMode = "hourly" or "hybrid") */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  hourlyRate: number | null;

  /** Minimum hours for hourly bookings (default 4) */
  @Column({ type: "smallint", default: 4 })
  minHours: number;

  /** Flat daily rate (used when pricingMode = "daily" or "hybrid") */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  dailyRate: number | null;

  /** Package name (e.g. "Wedding Package") — used when pricingMode = "package" */
  @Column({ type: "varchar", nullable: true })
  packageName: string | null;

  /** Package price — fixed total cost */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  packageRate: number | null;

  /** How many hours the package includes */
  @Column({ type: "smallint", nullable: true })
  packageHoursIncluded: number | null;

  /** Free-text package description */
  @Column("text", { nullable: true })
  packageDescription: string | null;

  /** Buffer before each event (minutes) for setup */
  @Column({ type: "smallint", default: 60 })
  setupMinutes: number;

  /** Buffer after each event (minutes) for teardown */
  @Column({ type: "smallint", default: 60 })
  teardownMinutes: number;

  // ── Relations ────────────────────────────────────────────────────────────

  @ManyToOne(() => EventCenter, (ec) => ec.spaces, { onDelete: "CASCADE" })
  @JoinColumn({ name: "eventCenterId" })
  eventCenter: EventCenter;

  @Column()
  eventCenterId: string;

  @OneToMany(() => EventSpaceImage, (img) => img.eventSpace, { cascade: true })
  images: EventSpaceImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
