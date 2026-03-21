"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HostKyc1742398000000 = void 0;
class HostKyc1742398000000 {
    constructor() {
        this.name = "HostKyc1742398000000";
    }
    async up(queryRunner) {
        // Add KYC status enum type
        await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE kyc_status_enum AS ENUM ('not_submitted', 'pending', 'approved', 'rejected');
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);
        await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "kycStatus"         kyc_status_enum NOT NULL DEFAULT 'not_submitted',
        ADD COLUMN IF NOT EXISTS "kycDocumentType"   varchar,
        ADD COLUMN IF NOT EXISTS "kycDocumentUrl"    varchar,
        ADD COLUMN IF NOT EXISTS "kycDocumentPublicId" varchar,
        ADD COLUMN IF NOT EXISTS "kycSubmittedAt"    timestamptz,
        ADD COLUMN IF NOT EXISTS "kycReviewedAt"     timestamptz,
        ADD COLUMN IF NOT EXISTS "kycRejectionReason" varchar
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "kycStatus",
        DROP COLUMN IF EXISTS "kycDocumentType",
        DROP COLUMN IF EXISTS "kycDocumentUrl",
        DROP COLUMN IF EXISTS "kycDocumentPublicId",
        DROP COLUMN IF EXISTS "kycSubmittedAt",
        DROP COLUMN IF EXISTS "kycReviewedAt",
        DROP COLUMN IF EXISTS "kycRejectionReason"
    `);
        await queryRunner.query(`DROP TYPE IF EXISTS kyc_status_enum`);
    }
}
exports.HostKyc1742398000000 = HostKyc1742398000000;
//# sourceMappingURL=1742398000000-HostKyc.js.map