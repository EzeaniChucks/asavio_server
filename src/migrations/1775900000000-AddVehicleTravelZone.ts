import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleTravelZone1775900000000 implements MigrationInterface {
  name = "AddVehicleTravelZone1775900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Travel zone config on vehicles
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "travelZone"              varchar(100) NOT NULL DEFAULT 'Lagos',
        ADD COLUMN IF NOT EXISTS "allowInterstate"         boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "interstateSurchargePerDay" numeric(10,2) DEFAULT NULL
    `);

    // Travel scope + destination on bookings
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "travelScope"  varchar(20) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "destination"  varchar(200) DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicles"
        DROP COLUMN IF EXISTS "travelZone",
        DROP COLUMN IF EXISTS "allowInterstate",
        DROP COLUMN IF EXISTS "interstateSurchargePerDay"
    `);
    await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "travelScope",
        DROP COLUMN IF EXISTS "destination"
    `);
  }
}
