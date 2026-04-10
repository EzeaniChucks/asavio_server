"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCancellationPolicy1775800000000 = void 0;
class AddCancellationPolicy1775800000000 {
    constructor() {
        this.name = "AddCancellationPolicy1775800000000";
    }
    async up(queryRunner) {
        // cancellationPolicy on listings
        await queryRunner.query(`
      ALTER TABLE "properties"
        ADD COLUMN IF NOT EXISTS "cancellationPolicy" varchar(20) NOT NULL DEFAULT 'flexible'
    `);
        await queryRunner.query(`
      ALTER TABLE "vehicles"
        ADD COLUMN IF NOT EXISTS "cancellationPolicy" varchar(20) NOT NULL DEFAULT 'flexible'
    `);
        // Refund tracking on bookings
        await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "refundedAmount" numeric(10,2) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "cancelledAt" timestamptz DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "cancelledBy" varchar(10) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS "cancellationReason" text DEFAULT NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "cancellationPolicy"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "cancellationPolicy"`);
        await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "refundedAmount",
        DROP COLUMN IF EXISTS "cancelledAt",
        DROP COLUMN IF EXISTS "cancelledBy",
        DROP COLUMN IF EXISTS "cancellationReason"
    `);
    }
}
exports.AddCancellationPolicy1775800000000 = AddCancellationPolicy1775800000000;
//# sourceMappingURL=1775800000000-AddCancellationPolicy.js.map