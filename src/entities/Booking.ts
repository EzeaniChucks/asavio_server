// src/entities/Booking.ts
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
import { Property } from "./Property";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Property, (property) => property.bookings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @Column()
  propertyId: string;

  @Column({ type: "date" })
  checkIn: Date;

  @Column({ type: "date" })
  checkOut: Date;

  @Column({ type: "int" })
  guests: number;

  @Column("decimal", { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({
    type: "enum",
    enum: ["pending", "confirmed", "cancelled", "completed"],
    default: "pending",
  })
  status: BookingStatus;

  @Column({ nullable: true })
  specialRequests: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
