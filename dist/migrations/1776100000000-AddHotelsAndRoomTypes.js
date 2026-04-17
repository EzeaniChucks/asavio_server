"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddHotelsAndRoomTypes1776100000000 = void 0;
/**
 * Hotels feature — Phase 1.
 * Creates `hotels`, `room_types`, `hotel_images`, `room_type_images` tables.
 * Extends `bookings` with nullable `hotelId`, `roomTypeId`, and `quantity`.
 */
class AddHotelsAndRoomTypes1776100000000 {
    async up(queryRunner) {
        // Shared enum (may already exist from Property table — reuse safely)
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hotels_status_enum') THEN
          CREATE TYPE "hotels_status_enum" AS ENUM ('pending', 'approved', 'rejected');
        END IF;
      END$$;
    `);
        // ── hotels ──────────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hotels" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text NOT NULL,
        "hotelType" varchar NOT NULL DEFAULT 'Hotel',
        "starRating" smallint,
        "verifiedStarRating" boolean NOT NULL DEFAULT false,
        "location" jsonb NOT NULL,
        "amenities" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "nearbyPlaces" jsonb,
        "checkInTime" varchar(5) NOT NULL DEFAULT '14:00',
        "checkOutTime" varchar(5) NOT NULL DEFAULT '11:00',
        "cancellationPolicy" varchar NOT NULL DEFAULT 'flexible',
        "checkInInstructions" text,
        "status" "hotels_status_enum" NOT NULL DEFAULT 'pending',
        "rejectionReason" text,
        "isAvailable" boolean NOT NULL DEFAULT true,
        "averageRating" double precision NOT NULL DEFAULT 0,
        "totalReviews" integer NOT NULL DEFAULT 0,
        "viewCount" integer NOT NULL DEFAULT 0,
        "featureVideoUrl" text,
        "featureVideoPublicId" varchar,
        "hostId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_hotels_host" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_hotels_hostId"  ON "hotels" ("hostId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_hotels_status"  ON "hotels" ("status");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_hotels_city"    ON "hotels" ((lower(("location"->>'city'))));`);
        // ── room_types ──────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "room_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text,
        "pricePerNight" numeric(10,2) NOT NULL,
        "maxGuests" smallint NOT NULL,
        "totalUnits" smallint NOT NULL DEFAULT 1,
        "bedType" varchar,
        "roomSize" varchar,
        "roomAmenities" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "cautionFee" numeric(10,2),
        "hotelId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_room_types_hotel" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE
      );
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_room_types_hotelId" ON "room_types" ("hotelId");`);
        // ── hotel_images ────────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "hotel_images" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "url" varchar NOT NULL,
        "publicId" varchar NOT NULL,
        "altText" varchar,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "hotelId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_hotel_images_hotel" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE
      );
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_hotel_images_hotelId" ON "hotel_images" ("hotelId");`);
        // ── room_type_images ────────────────────────────────────────────────
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "room_type_images" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "url" varchar NOT NULL,
        "publicId" varchar NOT NULL,
        "altText" varchar,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "roomTypeId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_room_type_images_room_type" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE
      );
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_room_type_images_roomTypeId" ON "room_type_images" ("roomTypeId");`);
        // ── bookings: add hotel/room references ─────────────────────────────
        await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "hotelId"    uuid,
      ADD COLUMN IF NOT EXISTS "roomTypeId" uuid,
      ADD COLUMN IF NOT EXISTS "quantity"   smallint NOT NULL DEFAULT 1;
    `);
        await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_hotel'
        ) THEN
          ALTER TABLE "bookings"
          ADD CONSTRAINT "fk_bookings_hotel"
          FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'fk_bookings_room_type'
        ) THEN
          ALTER TABLE "bookings"
          ADD CONSTRAINT "fk_bookings_room_type"
          FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE;
        END IF;
      END$$;
    `);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_hotelId"    ON "bookings" ("hotelId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_bookings_roomTypeId" ON "bookings" ("roomTypeId");`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "fk_bookings_room_type";`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "fk_bookings_hotel";`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "quantity";`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "roomTypeId";`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "hotelId";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "room_type_images";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "hotel_images";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "room_types";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "hotels";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "hotels_status_enum";`);
    }
}
exports.AddHotelsAndRoomTypes1776100000000 = AddHotelsAndRoomTypes1776100000000;
//# sourceMappingURL=1776100000000-AddHotelsAndRoomTypes.js.map