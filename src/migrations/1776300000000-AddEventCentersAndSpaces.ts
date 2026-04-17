import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Event Centers feature — Phase 2.
 * Creates `event_centers`, `event_spaces`, `event_bookings`,
 * `event_center_images`, `event_space_images` tables.
 */
export class AddEventCentersAndSpaces1776300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Reuse hotels_status_enum if it exists, otherwise create
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_centers_status_enum') THEN
          CREATE TYPE "event_centers_status_enum" AS ENUM ('pending', 'approved', 'rejected');
        END IF;
      END$$;
    `);

    // ── event_centers ────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_centers" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text NOT NULL,
        "location" jsonb NOT NULL,
        "amenities" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "nearbyPlaces" jsonb,
        "allowedEventTypes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "blockedEventTypes" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "cancellationPolicy" varchar NOT NULL DEFAULT 'flexible',
        "status" "event_centers_status_enum" NOT NULL DEFAULT 'pending',
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
        CONSTRAINT "fk_event_centers_host" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_centers_hostId" ON "event_centers" ("hostId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_centers_status" ON "event_centers" ("status");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_centers_city" ON "event_centers" ((lower(("location"->>'city'))));`);

    // ── event_center_images ──────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_center_images" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "url" varchar NOT NULL,
        "publicId" varchar NOT NULL,
        "altText" varchar,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "eventCenterId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_ec_images_event_center" FOREIGN KEY ("eventCenterId") REFERENCES "event_centers"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_ec_images_eventCenterId" ON "event_center_images" ("eventCenterId");`);

    // ── event_spaces ─────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_spaces" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "description" text,
        "capacity" integer NOT NULL,
        "pricingMode" varchar NOT NULL DEFAULT 'hourly',
        "hourlyRate" numeric(10,2),
        "minHours" smallint NOT NULL DEFAULT 4,
        "dailyRate" numeric(10,2),
        "packageName" varchar,
        "packageRate" numeric(10,2),
        "packageHoursIncluded" smallint,
        "packageDescription" text,
        "setupMinutes" smallint NOT NULL DEFAULT 60,
        "teardownMinutes" smallint NOT NULL DEFAULT 60,
        "eventCenterId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_event_spaces_event_center" FOREIGN KEY ("eventCenterId") REFERENCES "event_centers"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_spaces_eventCenterId" ON "event_spaces" ("eventCenterId");`);

    // ── event_space_images ───────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_space_images" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "url" varchar NOT NULL,
        "publicId" varchar NOT NULL,
        "altText" varchar,
        "isPrimary" boolean NOT NULL DEFAULT false,
        "eventSpaceId" uuid NOT NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_es_images_event_space" FOREIGN KEY ("eventSpaceId") REFERENCES "event_spaces"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_es_images_eventSpaceId" ON "event_space_images" ("eventSpaceId");`);

    // ── event_bookings enums ─────────────────────────────────────
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_bookings_status_enum') THEN
          CREATE TYPE "event_bookings_status_enum" AS ENUM ('awaiting_payment', 'confirmed', 'cancelled', 'completed');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_bookings_paymentstatus_enum') THEN
          CREATE TYPE "event_bookings_paymentstatus_enum" AS ENUM ('pending', 'paid', 'failed', 'refunded');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_bookings_hostpayoutstatus_enum') THEN
          CREATE TYPE "event_bookings_hostpayoutstatus_enum" AS ENUM ('pending', 'processing', 'transferred', 'failed');
        END IF;
      END$$;
    `);

    // ── event_bookings ───────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "event_bookings" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "eventCenterId" uuid NOT NULL,
        "eventSpaceId" uuid NOT NULL,
        "eventDate" date NOT NULL,
        "startTime" time NOT NULL,
        "endTime" time NOT NULL,
        "eventType" varchar NOT NULL,
        "attendeeCount" integer NOT NULL,
        "pricingUsed" varchar NOT NULL,
        "totalPrice" numeric(10,2) NOT NULL,
        "platformCommission" numeric(10,2) NOT NULL DEFAULT 0,
        "hostPayout" numeric(10,2) NOT NULL DEFAULT 0,
        "appliedCommissionRate" numeric(5,4),
        "currency" varchar(3) NOT NULL DEFAULT 'NGN',
        "status" "event_bookings_status_enum" NOT NULL DEFAULT 'awaiting_payment',
        "paymentMethod" varchar NOT NULL DEFAULT 'paystack',
        "paymentStatus" "event_bookings_paymentstatus_enum" NOT NULL DEFAULT 'pending',
        "paystackReference" varchar,
        "hostPayoutStatus" "event_bookings_hostpayoutstatus_enum" NOT NULL DEFAULT 'pending',
        "payoutReference" varchar,
        "specialRequests" text,
        "refundedAmount" numeric(10,2),
        "cancelledAt" timestamptz,
        "cancelledBy" varchar(10),
        "cancellationReason" text,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "fk_event_bookings_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_event_bookings_event_center" FOREIGN KEY ("eventCenterId") REFERENCES "event_centers"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_event_bookings_event_space" FOREIGN KEY ("eventSpaceId") REFERENCES "event_spaces"("id") ON DELETE CASCADE
      );
    `);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_bookings_userId" ON "event_bookings" ("userId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_bookings_eventCenterId" ON "event_bookings" ("eventCenterId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_bookings_eventSpaceId" ON "event_bookings" ("eventSpaceId");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_event_bookings_eventDate" ON "event_bookings" ("eventDate");`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "event_bookings";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_bookings_hostpayoutstatus_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_bookings_paymentstatus_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_bookings_status_enum";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_space_images";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_spaces";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_center_images";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "event_centers";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_centers_status_enum";`);
  }
}
