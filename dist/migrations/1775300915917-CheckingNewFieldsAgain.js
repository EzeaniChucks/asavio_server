"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingNewFieldsAgain1775300915917 = void 0;
class CheckingNewFieldsAgain1775300915917 {
    constructor() {
        this.name = 'CheckingNewFieldsAgain1775300915917';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }
}
exports.CheckingNewFieldsAgain1775300915917 = CheckingNewFieldsAgain1775300915917;
//# sourceMappingURL=1775300915917-CheckingNewFieldsAgain.js.map