"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IAMFeatures1774800000000 = void 0;
class IAMFeatures1774800000000 {
    async up(qr) {
        // ── Users table: new IAM columns ───────────────────────────────────────
        await qr.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS "isEmailVerified"          BOOLEAN      NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "emailVerificationToken"   VARCHAR,
        ADD COLUMN IF NOT EXISTS "emailVerificationExpires" TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS "isSuperAdmin"             BOOLEAN      NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "adminPermissions"         TEXT
    `);
        // ── Revoked tokens table ───────────────────────────────────────────────
        await qr.query(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "tokenHash"  VARCHAR     NOT NULL UNIQUE,
        "userId"     VARCHAR     NOT NULL,
        "expiresAt"  TIMESTAMPTZ NOT NULL,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await qr.query(`CREATE INDEX IF NOT EXISTS idx_revoked_tokens_hash    ON revoked_tokens ("tokenHash")`);
        await qr.query(`CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens ("expiresAt")`);
        // ── Admin audit logs table ─────────────────────────────────────────────
        await qr.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "adminId"     VARCHAR     NOT NULL,
        "adminEmail"  VARCHAR     NOT NULL,
        "adminName"   VARCHAR     NOT NULL,
        action        VARCHAR     NOT NULL,
        "targetType"  VARCHAR,
        "targetId"    VARCHAR,
        details       JSONB,
        "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
        await qr.query(`CREATE INDEX IF NOT EXISTS idx_audit_admin_id    ON admin_audit_logs ("adminId")`);
        await qr.query(`CREATE INDEX IF NOT EXISTS idx_audit_created_at  ON admin_audit_logs ("createdAt")`);
    }
    async down(qr) {
        await qr.query(`DROP TABLE IF EXISTS admin_audit_logs`);
        await qr.query(`DROP TABLE IF EXISTS revoked_tokens`);
        await qr.query(`
      ALTER TABLE users
        DROP COLUMN IF EXISTS "isEmailVerified",
        DROP COLUMN IF EXISTS "emailVerificationToken",
        DROP COLUMN IF EXISTS "emailVerificationExpires",
        DROP COLUMN IF EXISTS "isSuperAdmin",
        DROP COLUMN IF EXISTS "adminPermissions"
    `);
    }
}
exports.IAMFeatures1774800000000 = IAMFeatures1774800000000;
//# sourceMappingURL=1774800000000-IAMFeatures.js.map