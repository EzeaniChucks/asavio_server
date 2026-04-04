import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyVideoAndAnalytics1775100000000 implements MigrationInterface {
  name = "AddPropertyVideoAndAnalytics1775100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "featureVideoUrl"       text,
      ADD COLUMN IF NOT EXISTS "featureVideoPublicId"  character varying,
      ADD COLUMN IF NOT EXISTS "viewCount"             integer NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "viewCount",
      DROP COLUMN IF EXISTS "featureVideoPublicId",
      DROP COLUMN IF EXISTS "featureVideoUrl"
    `);
  }
}
