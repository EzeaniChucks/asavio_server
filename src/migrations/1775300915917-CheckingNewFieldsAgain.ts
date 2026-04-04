import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckingNewFieldsAgain1775300915917 implements MigrationInterface {
    name = 'CheckingNewFieldsAgain1775300915917'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }

}
