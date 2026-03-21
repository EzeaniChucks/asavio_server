"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVehicleBookings1774200000000 = void 0;
class AddVehicleBookings1774200000000 {
    constructor() {
        this.name = "AddVehicleBookings1774200000000";
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "vehicleId"`);
        await queryRunner.query(`ALTER TABLE "bookings" ALTER COLUMN "propertyId" SET NOT NULL`);
    }
}
exports.AddVehicleBookings1774200000000 = AddVehicleBookings1774200000000;
//# sourceMappingURL=1774200000000-AddVehicleBookings.js.map