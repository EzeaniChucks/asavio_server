import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVehicleBookings1774200000000 implements MigrationInterface {
  name = "AddVehicleBookings1774200000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make propertyId nullable so vehicle-only bookings can exist
    await queryRunner.query(`
      ALTER TABLE "bookings" ALTER COLUMN "propertyId" DROP NOT NULL
    `);

    // Add vehicleId FK column
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "vehicleId" uuid
          REFERENCES "vehicles"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "vehicleId"`);
    await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "propertyId" SET NOT NULL`);
  }
}
