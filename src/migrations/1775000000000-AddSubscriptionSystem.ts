import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionSystem1775000000000 implements MigrationInterface {
  name = "AddSubscriptionSystem1775000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Subscription tier enum on users table (stored as varchar, not Postgres ENUM,
    //    so downgrade paths don't require dropping the enum type)
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "subscriptionTier" character varying NOT NULL DEFAULT 'starter'
    `);

    // 2. Subscriptions table
    await queryRunner.query(`
      CREATE TYPE "subscriptions_tier_enum" AS ENUM ('starter', 'pro', 'elite')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscriptions_billing_cycle_enum" AS ENUM ('monthly', 'annual')
    `);
    await queryRunner.query(`
      CREATE TYPE "subscriptions_status_enum" AS ENUM ('active', 'cancelled', 'expired', 'past_due')
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id"                       uuid                              NOT NULL DEFAULT uuid_generate_v4(),
        "hostId"                   uuid                              NOT NULL,
        "tier"                     "subscriptions_tier_enum"         NOT NULL DEFAULT 'starter',
        "billingCycle"             "subscriptions_billing_cycle_enum" NOT NULL DEFAULT 'monthly',
        "status"                   "subscriptions_status_enum"       NOT NULL DEFAULT 'active',
        "paystackSubscriptionCode" character varying,
        "paystackCustomerCode"     character varying,
        "paystackPlanCode"         character varying,
        "paystackEmailToken"       character varying,
        "currentPeriodStart"       TIMESTAMP WITH TIME ZONE          NOT NULL,
        "currentPeriodEnd"         TIMESTAMP WITH TIME ZONE          NOT NULL,
        "cancelledAt"              TIMESTAMP WITH TIME ZONE,
        "cancellationReason"       text,
        "createdAt"                TIMESTAMP WITH TIME ZONE          NOT NULL DEFAULT now(),
        "updatedAt"                TIMESTAMP WITH TIME ZONE          NOT NULL DEFAULT now(),
        CONSTRAINT "PK_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_subscriptions_host" FOREIGN KEY ("hostId")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_subscriptions_hostId" ON "subscriptions" ("hostId")
    `);

    // 3. Extend the notifications type enum to include subscription event types.
    //    Postgres only supports ADD VALUE, not removal — safe to run idempotently.
    await queryRunner.query(`
      ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'subscription_activated'
    `);
    await queryRunner.query(`
      ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'subscription_cancelled'
    `);
    await queryRunner.query(`
      ALTER TYPE "notifications_type_enum" ADD VALUE IF NOT EXISTS 'subscription_payment_failed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop subscriptions table and its types
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscriptions_hostId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscriptions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscriptions_billing_cycle_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscriptions_tier_enum"`);

    // Remove subscriptionTier from users
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionTier"`);

    // Note: Postgres ENUM values cannot be removed once added.
    // The subscription_* notification types will remain in the enum after rollback.
  }
}
