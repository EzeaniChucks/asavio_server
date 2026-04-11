import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionPlansConfig1776000000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "platform_settings"
      ADD COLUMN IF NOT EXISTS "subscriptionPlans" jsonb
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "platform_settings"
      DROP COLUMN IF EXISTS "subscriptionPlans"
    `);
  }
}
