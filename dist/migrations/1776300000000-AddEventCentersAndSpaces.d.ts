import { MigrationInterface, QueryRunner } from "typeorm";
/**
 * Event Centers feature — Phase 2.
 * Creates `event_centers`, `event_spaces`, `event_bookings`,
 * `event_center_images`, `event_space_images` tables.
 */
export declare class AddEventCentersAndSpaces1776300000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1776300000000-AddEventCentersAndSpaces.d.ts.map