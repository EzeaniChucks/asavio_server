import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserTierFields1774400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "users_hosttier_enum" AS ENUM ('new_host', 'trusted_host', 'top_host')
    `);
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "hostTier" "users_hosttier_enum" NOT NULL DEFAULT 'new_host',
        ADD COLUMN IF NOT EXISTS "responseRate" decimal(5,4) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "lastSeen" timestamptz
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "lastSeen",
        DROP COLUMN IF EXISTS "responseRate",
        DROP COLUMN IF EXISTS "hostTier"
    `);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_hosttier_enum"`);
  }
}
