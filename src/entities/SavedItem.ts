// src/entities/SavedItem.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
import { Hotel } from "./Hotel";
import { EventCenter } from "./EventCenter";

/**
 * One row per saved listing per user.
 * Exactly one of propertyId, vehicleId, or hotelId is set.
 */
@Entity("saved_items")
@Unique(["userId", "propertyId"])
@Unique(["userId", "vehicleId"])
@Unique(["userId", "hotelId"])
@Unique(["userId", "eventCenterId"])
export class SavedItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  propertyId: string | null;

  @Column({ nullable: true })
  vehicleId: string | null;

  @Column({ nullable: true })
  hotelId: string | null;

  @Column({ nullable: true })
  eventCenterId: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Property, { onDelete: "CASCADE", nullable: true, eager: false })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @ManyToOne(() => Vehicle, { onDelete: "CASCADE", nullable: true, eager: false })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle;

  @ManyToOne(() => Hotel, { onDelete: "CASCADE", nullable: true, eager: false })
  @JoinColumn({ name: "hotelId" })
  hotel: Hotel | null;

  @ManyToOne(() => EventCenter, { onDelete: "CASCADE", nullable: true, eager: false })
  @JoinColumn({ name: "eventCenterId" })
  eventCenter: EventCenter | null;

  @CreateDateColumn()
  createdAt: Date;
}
