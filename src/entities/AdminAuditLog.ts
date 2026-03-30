// src/entities/AdminAuditLog.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("admin_audit_logs")
export class AdminAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  adminId: string;

  @Column()
  adminEmail: string;

  @Column()
  adminName: string;

  /** e.g. "approve_property", "delete_user", "create_admin" */
  @Column()
  action: string;

  /** e.g. "property", "user", "booking" */
  @Column({ nullable: true })
  targetType: string;

  @Column({ nullable: true })
  targetId: string;

  @Column({ type: "jsonb", nullable: true })
  details: Record<string, any> | null;

  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
