import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckingNewMigrate1775327433078 implements MigrationInterface {
    name = 'CheckingNewMigrate1775327433078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }

}
