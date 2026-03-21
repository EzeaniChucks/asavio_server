"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingCurrency1742402000000 = void 0;
class BookingCurrency1742402000000 {
    constructor() {
        this.name = "BookingCurrency1742402000000";
    }
    async up(queryRunner) {
        // Add currency column — default NGN for all existing bookings
        await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "currency" varchar(3) NOT NULL DEFAULT 'NGN'
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS "currency"
    `);
    }
}
exports.BookingCurrency1742402000000 = BookingCurrency1742402000000;
//# sourceMappingURL=1742402000000-BookingCurrency.js.map