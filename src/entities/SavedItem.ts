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

/**
 * One row per saved listing per user.
 * Either propertyId OR vehicleId is set — never both.
 */
@Entity("saved_items")
@Unique(["userId", "propertyId"])
@Unique(["userId", "vehicleId"])
export class SavedItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  propertyId: string | null;

  @Column({ nullable: true })
  vehicleId: string | null;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Property, { onDelete: "CASCADE", nullable: true, eager: false })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @ManyToOne(() => Vehicle, { onDelete: "CASCADE", nullable: true, eager: false })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle;

  @CreateDateColumn()
  createdAt: Date;
}
