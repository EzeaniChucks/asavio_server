"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddPlatformSetting1774007515384 = void 0;
class AddPlatformSetting1774007515384 {
    constructor() {
        this.name = 'AddPlatformSetting1774007515384';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "platform_settings" ("id" integer NOT NULL DEFAULT '1', "commissionRate" numeric(5,4) NOT NULL DEFAULT '0.1', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2934aeb70ec285196dcab4a2e96" PRIMARY KEY ("id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "platform_settings"`);
    }
}
exports.AddPlatformSetting1774007515384 = AddPlatformSetting1774007515384;
//# sourceMappingURL=1774007515384-AddPlatformSetting.js.map