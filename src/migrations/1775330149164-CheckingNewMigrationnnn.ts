import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckingNewMigrationnnn1775330149164 implements MigrationInterface {
    name = 'CheckingNewMigrationnnn1775330149164'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }

}
