import { MigrationInterface, QueryRunner } from "typeorm";
/**
 * Adds nullable `eventCenterId` columns (+ FK + index) to reviews, conversations, saved_items.
 */
export declare class AddEventCenterFKsToRelatedTables1776400000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1776400000000-AddEventCenterFKsToRelatedTables.d.ts.map