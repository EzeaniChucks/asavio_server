// src/entities/RoomTypeImage.ts
// Per-room-type photos (one set of representative shots per room type)

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { RoomType } from "./RoomType";

@Entity("room_type_images")
export class RoomTypeImage {
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

  @ManyToOne(() => RoomType, (roomType) => roomType.images, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "roomTypeId" })
  roomType: RoomType;

  @Column()
  roomTypeId: string;

  @CreateDateColumn()
  createdAt: Date;
}
