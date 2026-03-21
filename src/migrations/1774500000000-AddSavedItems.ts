import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSavedItems1774500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "saved_items" (
        "id"         uuid NOT NULL DEFAULT gen_random_uuid(),
        "userId"     uuid NOT NULL,
        "propertyId" uuid,
        "vehicleId"  uuid,
        "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_saved_items" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_saved_items_user_property" UNIQUE ("userId", "propertyId"),
        CONSTRAINT "UQ_saved_items_user_vehicle"  UNIQUE ("userId", "vehicleId"),
        CONSTRAINT "FK_saved_items_user"     FOREIGN KEY ("userId")     REFERENCES "users"      ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_saved_items_property" FOREIGN KEY ("propertyId") REFERENCES "properties" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_saved_items_vehicle"  FOREIGN KEY ("vehicleId")  REFERENCES "vehicles"   ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_saved_items_userId" ON "saved_items" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "saved_items"`);
  }
}
