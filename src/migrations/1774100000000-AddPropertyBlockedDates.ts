import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPropertyBlockedDates1774100000000 implements MigrationInterface {
  name = "AddPropertyBlockedDates1774100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
        ADD COLUMN IF NOT EXISTS "blockedDates" jsonb NOT NULL DEFAULT '[]'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties" DROP COLUMN IF EXISTS "blockedDates"
    `);
  }
}
