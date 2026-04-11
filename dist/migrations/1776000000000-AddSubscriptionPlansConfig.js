"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddSubscriptionPlansConfig1776000000000 = void 0;
class AddSubscriptionPlansConfig1776000000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "platform_settings"
      ADD COLUMN IF NOT EXISTS "subscriptionPlans" jsonb
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "platform_settings"
      DROP COLUMN IF EXISTS "subscriptionPlans"
    `);
    }
}
exports.AddSubscriptionPlansConfig1776000000000 = AddSubscriptionPlansConfig1776000000000;
//# sourceMappingURL=1776000000000-AddSubscriptionPlansConfig.js.map