"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVehicleVideo1775200000000 = void 0;
class AddVehicleVideo1775200000000 {
    constructor() {
        this.name = "AddVehicleVideo1775200000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "vehicles"
      ADD COLUMN IF NOT EXISTS "featureVideoUrl"      text,
      ADD COLUMN IF NOT EXISTS "featureVideoPublicId" character varying
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "vehicles"
      DROP COLUMN IF EXISTS "featureVideoPublicId",
      DROP COLUMN IF EXISTS "featureVideoUrl"
    `);
    }
}
exports.AddVehicleVideo1775200000000 = AddVehicleVideo1775200000000;
//# sourceMappingURL=1775200000000-AddVehicleVideo.js.map