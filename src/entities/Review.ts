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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
