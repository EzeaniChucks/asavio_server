"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleDriverPricing1742390000000 = void 0;
class VehicleDriverPricing1742390000000 {
    constructor() {
        this.name = "VehicleDriverPricing1742390000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "priceWithDriverPerDay" numeric(10,2) NULL
    `);
        // Back-fill: existing vehicles that had withDriver=true get their driver price
        // set to their existing pricePerDay so nothing breaks
        await queryRunner.query(`
      UPDATE "vehicles"
      SET "priceWithDriverPerDay" = "pricePerDay"
      WHERE "withDriver" = true AND "priceWithDriverPerDay" IS NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "priceWithDriverPerDay"`);
    }
}
exports.VehicleDriverPricing1742390000000 = VehicleDriverPricing1742390000000;
//# sourceMappingURL=1742390000000-VehicleDriverPricing.js.map