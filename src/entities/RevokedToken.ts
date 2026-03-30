// src/entities/RevokedToken.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("revoked_tokens")
export class RevokedToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ unique: true })
  tokenHash: string;

  @Column()
  userId: string;

  @Column({ type: "timestamptz" })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
