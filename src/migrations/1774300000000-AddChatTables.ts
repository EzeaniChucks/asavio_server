import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatTables1774300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "guestId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "hostId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "propertyId" uuid REFERENCES "properties"("id") ON DELETE SET NULL,
        "vehicleId" uuid REFERENCES "vehicles"("id") ON DELETE SET NULL,
        "lastMessageAt" timestamptz,
        "lastMessagePreview" text,
        "guestFirstMessageAt" timestamptz,
        "hostFirstReplyAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "conversationId" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
        "senderId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "body" text NOT NULL,
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "notifications_type_enum" AS ENUM (
        'message', 'booking_request', 'booking_confirmed', 'booking_cancelled',
        'booking_completed', 'review_received', 'kyc_approved', 'kyc_rejected',
        'listing_approved', 'listing_rejected', 'payout_transferred'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" "notifications_type_enum" NOT NULL,
        "title" varchar NOT NULL,
        "body" text NOT NULL,
        "data" jsonb,
        "isRead" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_conversations_guestId" ON "conversations"("guestId")`);
    await queryRunner.query(`CREATE INDEX "idx_conversations_hostId" ON "conversations"("hostId")`);
    await queryRunner.query(`CREATE INDEX "idx_messages_conversationId" ON "messages"("conversationId")`);
    await queryRunner.query(`CREATE INDEX "idx_notifications_userId_isRead" ON "notifications"("userId", "isRead")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_userId_isRead"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_messages_conversationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_conversations_hostId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_conversations_guestId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notifications_type_enum"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
  }
}
