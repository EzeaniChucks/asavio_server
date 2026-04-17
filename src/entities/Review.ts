// src/entities/Review.ts
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
import { Vehicle } from "./Vehicle";
import { Hotel } from "./Hotel";
import { EventCenter } from "./EventCenter";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "int" })
  rating: number; // 1–5

  @Column("text")
  comment: string;

  @ManyToOne(() => User, (user) => user.reviews, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Property, (property) => property.reviews, {
    onDelete: "CASCADE",
    nullable: true,
  })
  @JoinColumn({ name: "propertyId" })
  property: Property;

  @Column({ nullable: true })
  propertyId: string;

  @ManyToOne(() => Vehicle, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle;

  @Column({ nullable: true })
  vehicleId: string;

  @ManyToOne(() => Hotel, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "hotelId" })
  hotel: Hotel | null;

  @Column({ nullable: true })
  hotelId: string | null;

  @ManyToOne(() => EventCenter, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "eventCenterId" })
  eventCenter: EventCenter | null;

  @Column({ nullable: true })
  eventCenterId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
