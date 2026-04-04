"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingNewFields1775299035235 = void 0;
class CheckingNewFields1775299035235 {
    constructor() {
        this.name = 'CheckingNewFields1775299035235';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }
}
exports.CheckingNewFields1775299035235 = CheckingNewFields1775299035235;
//# sourceMappingURL=1775299035235-CheckingNewFields.js.map