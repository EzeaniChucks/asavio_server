import { MigrationInterface, QueryRunner } from "typeorm";

export class PasswordResetAndNormalizeTypes1774700000000 implements MigrationInterface {
  async up(qr: QueryRunner) {
    // Normalize all existing propertyType values to lowercase
    await qr.query(`UPDATE properties SET "propertyType" = LOWER("propertyType")`);

    // Add password reset columns to users
    await qr.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "passwordResetToken" VARCHAR,
        ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMPTZ
    `);
  }

  async down(qr: QueryRunner) {
    await qr.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS "passwordResetToken",
        DROP COLUMN IF EXISTS "passwordResetExpires"
    `);
  }
}
