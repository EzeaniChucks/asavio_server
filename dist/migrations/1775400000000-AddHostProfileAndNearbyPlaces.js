"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddHostProfileAndNearbyPlaces1775400000000 = void 0;
class AddHostProfileAndNearbyPlaces1775400000000 {
    async up(queryRunner) {
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
    async down(queryRunner) {
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
exports.AddHostProfileAndNearbyPlaces1775400000000 = AddHostProfileAndNearbyPlaces1775400000000;
//# sourceMappingURL=1775400000000-AddHostProfileAndNearbyPlaces.js.map