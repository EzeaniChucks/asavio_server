import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHostProfileAndNearbyPlaces1775400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        ADD COLUMN IF NOT EXISTS "bio" text NULL,
        ADD COLUMN IF NOT EXISTS "languages" jsonb NULL,
        ADD COLUMN IF NOT EXISTS "occupation" character varying NULL,
        ADD COLUMN IF NOT EXISTS "city" character varying NULL,
        ADD COLUMN IF NOT EXISTS "whyIHost" text NULL,
        ADD COLUMN IF NOT EXISTS "school" character varying NULL,
        ADD COLUMN IF NOT EXISTS "profileImagePublicId" character varying NULL;
    `);
    await queryRunner.query(`
      ALTER TABLE "properties"
        ADD COLUMN IF NOT EXISTS "nearbyPlaces" jsonb NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
        DROP COLUMN IF EXISTS "bio",
        DROP COLUMN IF EXISTS "languages",
        DROP COLUMN IF EXISTS "occupation",
        DROP COLUMN IF EXISTS "city",
        DROP COLUMN IF EXISTS "whyIHost",
        DROP COLUMN IF EXISTS "school",
        DROP COLUMN IF EXISTS "profileImagePublicId";
    `);
    await queryRunner.query(`
      ALTER TABLE "properties" DROP COLUMN IF EXISTS "nearbyPlaces";
    `);
  }
}
