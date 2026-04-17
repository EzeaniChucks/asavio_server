// src/entities/EventSpaceImage.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { EventSpace } from "./EventSpace";

@Entity("event_space_images")
export class EventSpaceImage {
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

  @ManyToOne(() => EventSpace, (es) => es.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "eventSpaceId" })
  eventSpace: EventSpace;

  @Column()
  eventSpaceId: string;

  @CreateDateColumn()
  createdAt: Date;
}
