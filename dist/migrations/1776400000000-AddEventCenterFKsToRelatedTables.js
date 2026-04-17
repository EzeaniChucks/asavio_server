"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEventCenterFKsToRelatedTables1776400000000 = void 0;
/**
 * Adds nullable `eventCenterId` columns (+ FK + index) to reviews, conversations, saved_items.
 */
class AddEventCenterFKsToRelatedTables1776400000000 {
    async up(queryRunner) {
        // ── reviews ─────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "eventCenterId" uuid;`);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reviews_event_center') THEN
          ALTER TABLE "reviews" ADD CONSTRAINT "fk_reviews_event_center"
          FOREIGN KEY ("eventCenterId") REFERENCES "event_centers"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_reviews_eventCenterId" ON "reviews" ("eventCenterId");`);
        // ── conversations ──────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "eventCenterId" uuid;`);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_conversations_event_center') THEN
          ALTER TABLE "conversations" ADD CONSTRAINT "fk_conversations_event_center"
          FOREIGN KEY ("eventCenterId") REFERENCES "event_centers"("id") ON DELETE SET NULL;
        END IF;
      END$$;
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_conversations_eventCenterId" ON "conversations" ("eventCenterId");`);
        // ── saved_items ────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "saved_items" ADD COLUMN IF NOT EXISTS "eventCenterId" uuid;`);
        await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_saved_items_event_center') THEN
          ALTER TABLE "saved_items" ADD CONSTRAINT "fk_saved_items_event_center"
          FOREIGN KEY ("eventCenterId") REFERENCES "event_centers"("id") ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_saved_items_userId_eventCenterId') THEN
          ALTER TABLE "saved_items" ADD CONSTRAINT "uq_saved_items_userId_eventCenterId"
          UNIQUE ("userId", "eventCenterId");
        END IF;
      END$$;
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_saved_items_eventCenterId" ON "saved_items" ("eventCenterId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "saved_items" DROP CONSTRAINT IF EXISTS "uq_saved_items_userId_eventCenterId";`);
        await queryRunner.query(`ALTER TABLE "saved_items" DROP CONSTRAINT IF EXISTS "fk_saved_items_event_center";`);
        await queryRunner.query(`ALTER TABLE "saved_items" DROP COLUMN IF EXISTS "eventCenterId";`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "fk_conversations_event_center";`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP COLUMN IF EXISTS "eventCenterId";`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "fk_reviews_event_center";`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP COLUMN IF EXISTS "eventCenterId";`);
    }
}
exports.AddEventCenterFKsToRelatedTables1776400000000 = AddEventCenterFKsToRelatedTables1776400000000;
//# sourceMappingURL=1776400000000-AddEventCenterFKsToRelatedTables.js.map