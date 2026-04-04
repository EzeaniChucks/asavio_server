import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCautionFee1775300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
        ADD COLUMN IF NOT EXISTS "cautionFee" numeric(10,2) NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "cautionFee" numeric(10,2) NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "cautionFee"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "cautionFee"`);
  }
}
