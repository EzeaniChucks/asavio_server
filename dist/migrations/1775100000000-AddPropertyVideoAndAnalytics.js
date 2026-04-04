"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPropertyVideoAndAnalytics1775100000000 = void 0;
class AddPropertyVideoAndAnalytics1775100000000 {
    constructor() {
        this.name = "AddPropertyVideoAndAnalytics1775100000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "properties"
      ADD COLUMN IF NOT EXISTS "featureVideoUrl"       text,
      ADD COLUMN IF NOT EXISTS "featureVideoPublicId"  character varying,
      ADD COLUMN IF NOT EXISTS "viewCount"             integer NOT NULL DEFAULT 0
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN IF EXISTS "viewCount",
      DROP COLUMN IF EXISTS "featureVideoPublicId",
      DROP COLUMN IF EXISTS "featureVideoUrl"
    `);
    }
}
exports.AddPropertyVideoAndAnalytics1775100000000 = AddPropertyVideoAndAnalytics1775100000000;
//# sourceMappingURL=1775100000000-AddPropertyVideoAndAnalytics.js.map