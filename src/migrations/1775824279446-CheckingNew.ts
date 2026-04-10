import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckingNew1775824279446 implements MigrationInterface {
    name = 'CheckingNew1775824279446'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "support_tickets_userId_fkey"`);
        await queryRunner.query(`DROP INDEX "public"."idx_support_tickets_userId"`);
        await queryRunner.query(`DROP INDEX "public"."idx_support_tickets_status"`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "travelZone" character varying NOT NULL DEFAULT 'Lagos'`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "allowInterstate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "interstateSurchargePerDay" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD "travelScope" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD "destination" character varying(200)`);
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "respondedByAdminId"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "respondedByAdminId" character varying`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD CONSTRAINT "FK_8679e2ff150ff0e253189ca0253" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP CONSTRAINT "FK_8679e2ff150ff0e253189ca0253"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "support_tickets" DROP COLUMN "respondedByAdminId"`);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD "respondedByAdminId" uuid`);
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "destination"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "travelScope"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "interstateSurchargePerDay"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "allowInterstate"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "travelZone"`);
        await queryRunner.query(`CREATE INDEX "idx_support_tickets_status" ON "support_tickets" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_support_tickets_userId" ON "support_tickets" ("userId") `);
        await queryRunner.query(`ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
