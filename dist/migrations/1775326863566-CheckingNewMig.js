"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingNewMig1775326863566 = void 0;
class CheckingNewMig1775326863566 {
    constructor() {
        this.name = 'CheckingNewMig1775326863566';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }
}
exports.CheckingNewMig1775326863566 = CheckingNewMig1775326863566;
//# sourceMappingURL=1775326863566-CheckingNewMig.js.map