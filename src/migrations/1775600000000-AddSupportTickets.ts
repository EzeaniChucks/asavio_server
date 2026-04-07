import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupportTickets1775600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "support_tickets_category_enum" AS ENUM (
        'payment', 'booking', 'listing', 'account', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "support_tickets_status_enum" AS ENUM (
        'open', 'in_progress', 'resolved', 'closed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "support_tickets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "subject" varchar NOT NULL,
        "category" "support_tickets_category_enum" NOT NULL DEFAULT 'other',
        "message" text NOT NULL,
        "status" "support_tickets_status_enum" NOT NULL DEFAULT 'open',
        "adminResponse" text,
        "respondedAt" timestamptz,
        "respondedByAdminId" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_support_tickets_userId" ON "support_tickets"("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_support_tickets_status" ON "support_tickets"("status")`);

    // Add support_ticket notification type
    await queryRunner.query(`ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'support_ticket'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_support_tickets_userId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "support_tickets"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_tickets_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "support_tickets_category_enum"`);
  }
}
