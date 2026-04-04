import { MigrationInterface, QueryRunner } from "typeorm";

export class CheckingNewlyAddedField1775302441150 implements MigrationInterface {
    name = 'CheckingNewlyAddedField1775302441150'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT '0.1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "platform_settings" ALTER COLUMN "commissionRate" SET DEFAULT 0.1`);
    }

}
