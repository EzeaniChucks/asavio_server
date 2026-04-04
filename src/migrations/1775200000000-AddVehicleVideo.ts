import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleVideo1775200000000 implements MigrationInterface {
  name = "AddVehicleVideo1775200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "featureVideoUrl"      text,
      ADD COLUMN IF NOT EXISTS "featureVideoPublicId" character varying
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
      DROP COLUMN IF EXISTS "featureVideoPublicId",
      DROP COLUMN IF EXISTS "featureVideoUrl"
    `);
  }
}
