"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVehicleStatus1775500000000 = void 0;
class AddVehicleStatus1775500000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE vehicles
      ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "rejectionReason" text;
    `);
        // Mark all existing vehicles as approved so current live listings aren't broken
        await queryRunner.query(`UPDATE vehicles SET status = 'approved' WHERE status = 'pending'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE vehicles DROP COLUMN IF EXISTS "status"`);
        await queryRunner.query(`ALTER TABLE vehicles DROP COLUMN IF EXISTS "rejectionReason"`);
    }
}
exports.AddVehicleStatus1775500000000 = AddVehicleStatus1775500000000;
//# sourceMappingURL=1775500000000-AddVehicleStatus.js.map