import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckingNewMigrationnnnn1775330325858 implements MigrationInterface {
    name = 'CheckingNewMigrationnnnn1775330325858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }

}
