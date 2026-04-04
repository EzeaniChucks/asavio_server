import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckingNewFields1775299035235 implements MigrationInterface {
    name = 'CheckingNewFields1775299035235'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }

}
