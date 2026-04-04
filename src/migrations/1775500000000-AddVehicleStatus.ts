import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleStatus1775500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "rejectionReason" text;
    `);
    // Mark all existing vehicles as approved so current live listings aren't broken
    await queryRunner.query(`UPDATE vehicles SET status = 'approved' WHERE status = 'pending'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE vehicles DROP COLUMN IF EXISTS "status"`);
    await queryRunner.query(`ALTER TABLE vehicles DROP COLUMN IF EXISTS "rejectionReason"`);
  }
}
