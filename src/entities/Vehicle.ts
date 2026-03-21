// src/entities/Vehicle.ts
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
import { Booking } from "./Booking";

@Entity("vehicles")
export class Vehicle {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  make: string; // e.g. Mercedes

  @Column()
  model: string; // e.g. S-Class

  @Column()
  year: number;

  @Column()
  vehicleType: string; // sedan, SUV, sports, luxury, etc.

  /** Self-drive daily price (always required) */
  @Column("decimal", { precision: 10, scale: 2 })
  pricePerDay: number;

  /** Driver option daily price — null means no driver option available */
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  priceWithDriverPerDay: number | null;

  @Column("text")
  description: string;

  @Column("jsonb")
  features: string[]; // e.g. ["GPS", "Bluetooth", "Heated seats"]

  @Column("jsonb")
  images: { url: string; publicId: string }[];

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  location: string;

  @Column({ default: 1 })
  seats: number;

  @Column({ default: false })
  withDriver: boolean;

  @Column("float", { default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  totalReviews: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hostId" })
  host: User;

  @Column()
  hostId: string;

  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
