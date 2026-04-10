"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVehicleBlockedDates1775700000000 = void 0;
class AddVehicleBlockedDates1775700000000 {
    constructor() {
        this.name = "AddVehicleBlockedDates1775700000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "blockedDates" jsonb NOT NULL DEFAULT '[]'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "blockedDates"
    `);
    }
}
exports.AddVehicleBlockedDates1775700000000 = AddVehicleBlockedDates1775700000000;
//# sourceMappingURL=1775700000000-AddVehicleBlockedDates.js.map