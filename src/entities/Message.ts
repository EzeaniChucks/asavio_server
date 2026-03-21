// src/entities/Message.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User";
import { Conversation } from "./Conversation";

@Entity("messages")
export class Message {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "conversationId" })
  conversation: Conversation;

  @Column()
  conversationId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "senderId" })
  sender: User;

  @Column()
  senderId: string;

  @Column("text")
  body: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: "timestamptz", nullable: true })
  readAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
