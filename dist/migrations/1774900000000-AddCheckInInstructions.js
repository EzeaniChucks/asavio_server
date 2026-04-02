"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCheckInInstructions1774900000000 = void 0;
class AddCheckInInstructions1774900000000 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "checkInInstructions" TEXT`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "checkInInstructions" TEXT`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "checkInInstructions"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "checkInInstructions"`);
    }
}
exports.AddCheckInInstructions1774900000000 = AddCheckInInstructions1774900000000;
//# sourceMappingURL=1774900000000-AddCheckInInstructions.js.map