"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialMigration1773556081315 = void 0;
class InitialMigration1773556081315 {
    constructor() {
        this.name = 'InitialMigration1773556081315';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."bookings_status_enum" AS ENUM('pending', 'confirmed', 'cancelled', 'completed')`);
        await queryRunner.query(`CREATE TABLE "bookings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "propertyId" uuid NOT NULL, "checkIn" date NOT NULL, "checkOut" date NOT NULL, "guests" integer NOT NULL, "totalPrice" numeric(10,2) NOT NULL, "status" "public"."bookings_status_enum" NOT NULL DEFAULT 'pending', "specialRequests" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "rating" integer NOT NULL, "comment" text NOT NULL, "userId" uuid NOT NULL, "propertyId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "images" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "url" character varying NOT NULL, "publicId" character varying NOT NULL, "altText" character varying, "isPrimary" boolean NOT NULL DEFAULT false, "propertyId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1fe148074c6a1a91b63cb9ee3c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "properties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "propertyType" character varying NOT NULL, "bedrooms" integer NOT NULL, "bathrooms" integer NOT NULL, "maxGuests" integer NOT NULL, "pricePerNight" numeric(10,2) NOT NULL, "amenities" jsonb NOT NULL, "location" jsonb NOT NULL, "isAvailable" boolean NOT NULL DEFAULT true, "hostId" uuid NOT NULL, "averageRating" double precision NOT NULL DEFAULT '0', "totalReviews" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2d83bfa0b9fcd45dee1785af44d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'host', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "phone" character varying, "profileImage" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "isVerified" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vehicles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "make" character varying NOT NULL, "model" character varying NOT NULL, "year" integer NOT NULL, "vehicleType" character varying NOT NULL, "pricePerDay" numeric(10,2) NOT NULL, "description" text NOT NULL, "features" jsonb NOT NULL, "images" jsonb NOT NULL, "isAvailable" boolean NOT NULL DEFAULT true, "location" character varying, "seats" integer NOT NULL DEFAULT '1', "withDriver" boolean NOT NULL DEFAULT false, "averageRating" double precision NOT NULL DEFAULT '0', "totalReviews" integer NOT NULL DEFAULT '0', "hostId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_38a69a58a323647f2e75eb994de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD CONSTRAINT "FK_cf064476d403971270369232d80" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_2c75ccf95bf502363885d076e76" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "images" ADD CONSTRAINT "FK_9c817df4bfb32b94e50ad07e4e0" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "properties" ADD CONSTRAINT "FK_97ae9ee8402b8d8d167fa7352ce" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD CONSTRAINT "FK_13adfa3269262d4766e1ed845c7" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vehicles" DROP CONSTRAINT "FK_13adfa3269262d4766e1ed845c7"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_97ae9ee8402b8d8d167fa7352ce"`);
        await queryRunner.query(`ALTER TABLE "images" DROP CONSTRAINT "FK_9c817df4bfb32b94e50ad07e4e0"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_2c75ccf95bf502363885d076e76"`);
        await queryRunner.query(`ALTER TABLE "reviews" DROP CONSTRAINT "FK_7ed5659e7139fc8bc039198cc1f"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_cf064476d403971270369232d80"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP CONSTRAINT "FK_38a69a58a323647f2e75eb994de"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "properties"`);
        await queryRunner.query(`DROP TABLE "images"`);
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "bookings"`);
        await queryRunner.query(`DROP TYPE "public"."bookings_status_enum"`);
    }
}
exports.InitialMigration1773556081315 = InitialMigration1773556081315;
//# sourceMappingURL=1773556081315-InitialMigration.js.map