"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JustCheckingIfThereArePendingMigrations1774006813391 = void 0;
class JustCheckingIfThereArePendingMigrations1774006813391 {
    constructor() {
        this.name = 'JustCheckingIfThereArePendingMigrations1774006813391';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "platform_settings" ("id" integer NOT NULL DEFAULT '1', "commissionRate" numeric(5,4) NOT NULL DEFAULT '0.1', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2934aeb70ec285196dcab4a2e96" PRIMARY KEY ("id"))`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "platform_settings"`);
    }
}
exports.JustCheckingIfThereArePendingMigrations1774006813391 = JustCheckingIfThereArePendingMigrations1774006813391;
//# sourceMappingURL=1774006813391-JustCheckingIfThereArePendingMigrations.js.map