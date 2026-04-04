"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingNewMigrationnnnn1775330325858 = void 0;
class CheckingNewMigrationnnnn1775330325858 {
    constructor() {
        this.name = 'CheckingNewMigrationnnnn1775330325858';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }
}
exports.CheckingNewMigrationnnnn1775330325858 = CheckingNewMigrationnnnn1775330325858;
//# sourceMappingURL=1775330325858-CheckingNewMigrationnnnn.js.map