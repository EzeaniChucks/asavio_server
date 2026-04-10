import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedTravelZone1775825857451 implements MigrationInterface {
    name = 'AddedTravelZone1775825857451'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "travelZone" character varying NOT NULL DEFAULT 'Lagos'`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "allowInterstate" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "interstateSurchargePerDay" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD "travelScope" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "bookings" ADD "destination" character varying(200)`);
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "destination"`);
        await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "travelScope"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "interstateSurchargePerDay"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "allowInterstate"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "travelZone"`);
    }

}
