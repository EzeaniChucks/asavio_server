// src/migrations/1774900000000-AddCheckInInstructions.ts
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCheckInInstructions1774900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "checkInInstructions" TEXT`
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "checkInInstructions" TEXT`
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN IF EXISTS "checkInInstructions"`
    );
    await queryRunner.query(
      `ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "checkInInstructions"`
    );
  }
}
