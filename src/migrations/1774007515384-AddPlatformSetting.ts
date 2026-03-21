import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformSetting1774007515384 implements MigrationInterface {
    name = 'AddPlatformSetting1774007515384'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "platform_settings" ("id" integer NOT NULL DEFAULT '1', "commissionRate" numeric(5,4) NOT NULL DEFAULT '0.1', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2934aeb70ec285196dcab4a2e96" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "platform_settings"`);
    }

}
