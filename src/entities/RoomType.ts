// src/entities/RoomType.ts
// A room TYPE (e.g. "Deluxe King") with a pool of interchangeable units.
// A booking draws `quantity` units from the pool — guests don't pick a specific room number.

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
import { Hotel } from "./Hotel";
import { RoomTypeImage } from "./RoomTypeImage";

@Entity("room_types")
export class RoomType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string; // e.g. "Deluxe King", "Standard Twin"

  @Column("text", { nullable: true })
  description: string | null;

  @Column("decimal", { precision: 10, scale: 2 })
  pricePerNight: number;

  @Column({ type: "smallint" })
  maxGuests: number;

  /** How many units of this room type the hotel has */
  @Column({ type: "smallint", default: 1 })
  totalUnits: number;

  /** "king" | "queen" | "twin" | "bunk" | "sofa-bed" | "double" */
  @Column({ nullable: true })
  bedType: string;

  /** Room size (free-text, e.g. "35 sqm") */
  @Column({ nullable: true })
  roomSize: string;

  /** Per-room amenities (AC, TV, minibar, safe, balcony) */
  @Column("jsonb", { default: [] })
  roomAmenities: string[];

  /** Optional refundable caution fee (advisory — host-collected) */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  cautionFee: number | null;

  // ── Relations ────────────────────────────────────────────────────────────

  @ManyToOne(() => Hotel, (hotel) => hotel.roomTypes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hotelId" })
  hotel: Hotel;

  @Column()
  hotelId: string;

  @OneToMany(() => RoomTypeImage, (image) => image.roomType, { cascade: true })
  images: RoomTypeImage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
