"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSharesManagement1742386000000 = void 0;
class PaymentSharesManagement1742386000000 {
    constructor() {
        this.name = "PaymentSharesManagement1742386000000";
    }
    async up(queryRunner) {
        // 1. Platform-wide commission settings (singleton row)
        await queryRunner.query(`
      CREATE TABLE "platform_settings" (
        "id" integer NOT NULL DEFAULT 1,
        "commissionRate" numeric(5,4) NOT NULL DEFAULT 0.1000,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_platform_settings" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_platform_settings_singleton" CHECK ("id" = 1)
      )
    `);
        // Seed the single settings row so the service always finds it
        await queryRunner.query(`
      INSERT INTO "platform_settings" ("id", "commissionRate") VALUES (1, 0.1000)
      ON CONFLICT DO NOTHING
    `);
        // 2. Per-host commission rate override on users table
        await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "commissionRateOverride" numeric(5,4) NULL
    `);
        // 3. Applied commission rate stored per booking for auditability
        await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "appliedCommissionRate" numeric(5,4) NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "appliedCommissionRate"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "commissionRateOverride"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "platform_settings"`);
    }
}
exports.PaymentSharesManagement1742386000000 = PaymentSharesManagement1742386000000;
//# sourceMappingURL=1742386000000-PaymentSharesManagement.js.map