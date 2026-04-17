// src/entities/HotelImage.ts
// Hotel-wide photos (lobby, exterior, common amenities)

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Hotel } from "./Hotel";

@Entity("hotel_images")
export class HotelImage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @Column()
  publicId: string;

  @Column({ nullable: true })
  altText: string;

  @Column({ default: false })
  isPrimary: boolean;

  @ManyToOne(() => Hotel, (hotel) => hotel.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hotelId" })
  hotel: Hotel;

  @Column()
  hotelId: string;

  @CreateDateColumn()
  createdAt: Date;
}
