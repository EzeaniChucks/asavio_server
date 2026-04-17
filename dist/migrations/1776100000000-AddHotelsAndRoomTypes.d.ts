import { MigrationInterface, QueryRunner } from "typeorm";
/**
 * Hotels feature — Phase 1.
 * Creates `hotels`, `room_types`, `hotel_images`, `room_type_images` tables.
 * Extends `bookings` with nullable `hotelId`, `roomTypeId`, and `quantity`.
 */
export declare class AddHotelsAndRoomTypes1776100000000 implements MigrationInterface {
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
//# sourceMappingURL=1776100000000-AddHotelsAndRoomTypes.d.ts.map