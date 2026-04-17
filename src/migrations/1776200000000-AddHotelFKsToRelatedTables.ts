import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds nullable `hotelId` columns (+ FK + index) to reviews, conversations, saved_items.
 * Part of the Hotels feature rollout. Safe to re-run.
 */
export class AddHotelFKsToRelatedTables1776200000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // ── reviews ─────────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "hotelId" uuid;`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_reviews_hotel'
        ) THEN
          ALTER TABLE "reviews"
          ADD CONSTRAINT "fk_reviews_hotel"
          FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_reviews_hotelId" ON "reviews" ("hotelId");`);

    // ── conversations ──────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "hotelId" uuid;`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_hotel'
        ) THEN
          ALTER TABLE "conversations"
          ADD CONSTRAINT "fk_conversations_hotel"
          FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_conversations_hotelId" ON "conversations" ("hotelId");`);

    // ── saved_items ────────────────────────────────────────────
    await queryRunner.query(`ALTER TABLE "saved_items" ADD COLUMN IF NOT EXISTS "hotelId" uuid;`);
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_saved_items_hotel'
        ) THEN
          ALTER TABLE "saved_items"
          ADD CONSTRAINT "fk_saved_items_hotel"
          FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_saved_items_userId_hotelId'
        ) THEN
          ALTER TABLE "saved_items"
          ADD CONSTRAINT "uq_saved_items_userId_hotelId"
          UNIQUE ("userId", "hotelId");
        END IF;
      END$$;
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_saved_items_hotelId" ON "saved_items" ("hotelId");`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "saved_items" DROP CONSTRAINT IF EXISTS "uq_saved_items_userId_hotelId";`);
    await queryRunner.query(`ALTER TABLE "saved_items" DROP CONSTRAINT IF EXISTS "fk_saved_items_hotel";`);
    await queryRunner.query(`ALTER TABLE "saved_items" DROP COLUMN IF EXISTS "hotelId";`);

    await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "fk_conversations_hotel";`);
    await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "hotelId";`);

    await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "fk_reviews_hotel";`);
    await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "hotelId";`);
  }
}
