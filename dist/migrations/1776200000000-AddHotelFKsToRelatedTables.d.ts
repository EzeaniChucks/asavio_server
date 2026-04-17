import { MigrationInterface, QueryRunner } from "typeorm";
/**
 * Adds nullable `hotelId` columns (+ FK + index) to reviews, conversations, saved_items.
 * Part of the Hotels feature rollout. Safe to re-run.
 */
export declare class AddHotelFKsToRelatedTables1776200000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1776200000000-AddHotelFKsToRelatedTables.d.ts.map