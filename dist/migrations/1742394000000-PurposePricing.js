"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurposePricing1742394000000 = void 0;
class PurposePricing1742394000000 {
    constructor() {
        this.name = "PurposePricing1742394000000";
    }
    async up(queryRunner) {
        // Per-purpose pricing map on properties
        await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "purposePricing" jsonb NULL
    `);
        // Purpose field on bookings (what the guest booked for)
        await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "purpose" character varying NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "purpose"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "purposePricing"`);
    }
}
exports.PurposePricing1742394000000 = PurposePricing1742394000000;
//# sourceMappingURL=1742394000000-PurposePricing.js.map