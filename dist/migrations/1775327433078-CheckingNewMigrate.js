"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingNewMigrate1775327433078 = void 0;
class CheckingNewMigrate1775327433078 {
    constructor() {
        this.name = 'CheckingNewMigrate1775327433078';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }
}
exports.CheckingNewMigrate1775327433078 = CheckingNewMigrate1775327433078;
//# sourceMappingURL=1775327433078-CheckingNewMigrate.js.map