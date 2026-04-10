"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVehicleTravelZone1775900000000 = void 0;
class AddVehicleTravelZone1775900000000 {
    constructor() {
        this.name = "AddVehicleTravelZone1775900000000";
    }
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.AddVehicleTravelZone1775900000000 = AddVehicleTravelZone1775900000000;
//# sourceMappingURL=1775900000000-AddVehicleTravelZone.js.map