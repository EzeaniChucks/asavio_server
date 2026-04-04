"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingNewlyAddedField1775302441150 = void 0;
class CheckingNewlyAddedField1775302441150 {
    constructor() {
        this.name = 'CheckingNewlyAddedField1775302441150';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }
}
exports.CheckingNewlyAddedField1775302441150 = CheckingNewlyAddedField1775302441150;
//# sourceMappingURL=1775302441150-CheckingNewlyAddedField.js.map