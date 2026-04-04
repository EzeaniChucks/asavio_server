"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCautionFee1775300000000 = void 0;
class AddCautionFee1775300000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "properties"
        ADD COLUMN IF NOT EXISTS "cautionFee" numeric(10,2) NULL;
    `);
        await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "cautionFee" numeric(10,2) NULL;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "cautionFee"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "cautionFee"`);
    }
}
exports.AddCautionFee1775300000000 = AddCautionFee1775300000000;
//# sourceMappingURL=1775300000000-AddCautionFee.js.map