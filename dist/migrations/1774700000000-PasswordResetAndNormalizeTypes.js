"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetAndNormalizeTypes1774700000000 = void 0;
class PasswordResetAndNormalizeTypes1774700000000 {
    async up(qr) {
        // Normalize all existing propertyType values to lowercase
        await qr.query(`UPDATE properties SET "propertyType" = LOWER("propertyType")`);
        // Add password reset columns to users
        await qr.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "passwordResetToken" VARCHAR,
        ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMPTZ
    `);
    }
    async down(qr) {
        await qr.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS "passwordResetToken",
        DROP COLUMN IF EXISTS "passwordResetExpires"
    `);
    }
}
exports.PasswordResetAndNormalizeTypes1774700000000 = PasswordResetAndNormalizeTypes1774700000000;
//# sourceMappingURL=1774700000000-PasswordResetAndNormalizeTypes.js.map