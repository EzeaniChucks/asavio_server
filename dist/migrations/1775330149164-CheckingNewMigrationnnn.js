"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckingNewMigrationnnn1775330149164 = void 0;
class CheckingNewMigrationnnn1775330149164 {
    constructor() {
        this.name = 'CheckingNewMigrationnnn1775330149164';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }
}
exports.CheckingNewMigrationnnn1775330149164 = CheckingNewMigrationnnn1775330149164;
//# sourceMappingURL=1775330149164-CheckingNewMigrationnnn.js.map