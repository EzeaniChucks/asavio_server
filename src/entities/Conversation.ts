// src/entities/Conversation.ts
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
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
import { Hotel } from "./Hotel";
import { EventCenter } from "./EventCenter";
import { Message } from "./Message";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "guestId" })
  guest: User;

  @Column()
  guestId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "hostId" })
  host: User;

  @Column()
  hostId: string;

  /** Optional — conversation is about a specific property */
  @ManyToOne(() => Property, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "propertyId" })
  property: Property | null;

  @Column({ nullable: true })
  propertyId: string | null;

  /** Optional — conversation is about a specific vehicle */
  @ManyToOne(() => Vehicle, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "vehicleId" })
  vehicle: Vehicle | null;

  @Column({ nullable: true })
  vehicleId: string | null;

  /** Optional — conversation is about a specific hotel */
  @ManyToOne(() => Hotel, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "hotelId" })
  hotel: Hotel | null;

  @Column({ nullable: true })
  hotelId: string | null;

  /** Optional — conversation is about a specific event center */
  @ManyToOne(() => EventCenter, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "eventCenterId" })
  eventCenter: EventCenter | null;

  @Column({ nullable: true })
  eventCenterId: string | null;

  @OneToMany(() => Message, (m) => m.conversation)
  messages: Message[];

  /** Updated whenever a new message is sent — drives conversation list ordering */
  @Column({ type: "timestamptz", nullable: true })
  lastMessageAt: Date | null;

  /** Preview text for conversation list */
  @Column({ type: "text", nullable: true })
  lastMessagePreview: string | null;

  /** When the guest sent their FIRST message — for response-rate tracking */
  @Column({ type: "timestamptz", nullable: true })
  guestFirstMessageAt: Date | null;

  /** When the host sent their FIRST reply — for response-rate tracking */
  @Column({ type: "timestamptz", nullable: true })
  hostFirstReplyAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
