// src/entities/PlatformSettings.ts
import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

/**
 * Singleton table — always exactly one row with id = 1.
 * Use PlatformSettingsService to read/write it.
 */
@Entity("platform_settings")
export class PlatformSettings {
  @PrimaryColumn({ type: "int", default: 1 })
  id: number;

  /** Global platform commission rate (0–1). e.g. 0.10 = 10% */
  @Column("decimal", { precision: 5, scale: 4, default: 0.1 })
  commissionRate: number;

  @UpdateDateColumn()
  updatedAt: Date;
}
