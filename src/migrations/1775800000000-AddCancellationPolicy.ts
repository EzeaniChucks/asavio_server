import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCancellationPolicy1775800000000 implements MigrationInterface {
  name = "AddCancellationPolicy1775800000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // cancellationPolicy on listings
    await queryRunner.query(`
      ALTER TABLE "properties"
        ADD COLUMN IF NOT EXISTS "cancellationPolicy" varchar(20) NOT NULL DEFAULT 'flexible'
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "cancellationPolicy" varchar(20) NOT NULL DEFAULT 'flexible'
    `);

    // Refund tracking on bookings
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "refundedAmount" numeric(10,2) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "cancelledAt" timestamptz DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "cancelledBy" varchar(10) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "cancellationReason" text DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "cancellationPolicy"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "cancellationPolicy"`);
    await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "refundedAmount",
        DROP COLUMN IF EXISTS "cancelledAt",
        DROP COLUMN IF EXISTS "cancelledBy",
        DROP COLUMN IF EXISTS "cancellationReason"
    `);
  }
}
