"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPropertyBlockedDates1774100000000 = void 0;
class AddPropertyBlockedDates1774100000000 {
    constructor() {
        this.name = "AddPropertyBlockedDates1774100000000";
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "properties"
        ADD COLUMN IF NOT EXISTS "blockedDates" jsonb NOT NULL DEFAULT '[]'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "properties" DROP COLUMN IF EXISTS "blockedDates"
    `);
    }
}
exports.AddPropertyBlockedDates1774100000000 = AddPropertyBlockedDates1774100000000;
//# sourceMappingURL=1774100000000-AddPropertyBlockedDates.js.map