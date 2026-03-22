import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationTypes1774600000000 implements MigrationInterface {
  async up(qr: QueryRunner) {
    await qr.query(`ALTER TYPE notifications_type_enum ADD VALUE IF NOT EXISTS 'kyc_submitted'`);
    await qr.query(`ALTER TYPE notifications_type_enum ADD VALUE IF NOT EXISTS 'listing_submitted'`);
    await qr.query(`ALTER TYPE notifications_type_enum ADD VALUE IF NOT EXISTS 'payout_failed'`);
  }
  async down(_qr: QueryRunner) {
    // PostgreSQL does not support removing enum values
  }
}
