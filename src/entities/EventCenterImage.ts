// src/entities/EventCenterImage.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { EventCenter } from "./EventCenter";

@Entity("event_center_images")
export class EventCenterImage {
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

  @ManyToOne(() => EventCenter, (ec) => ec.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "eventCenterId" })
  eventCenter: EventCenter;

  @Column()
  eventCenterId: string;

  @CreateDateColumn()
  createdAt: Date;
}
