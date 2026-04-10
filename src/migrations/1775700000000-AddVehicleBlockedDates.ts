import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleBlockedDates1775700000000 implements MigrationInterface {
  name = "AddVehicleBlockedDates1775700000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "blockedDates" jsonb NOT NULL DEFAULT '[]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "blockedDates"
    `);
  }
}
