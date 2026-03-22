"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddNotificationTypes1774600000000 = void 0;
class AddNotificationTypes1774600000000 {
    async up(qr) {
        await qr.query(`ALTER TYPE notifications_type_enum ADD VALUE IF NOT EXISTS 'kyc_submitted'`);
        await qr.query(`ALTER TYPE notifications_type_enum ADD VALUE IF NOT EXISTS 'listing_submitted'`);
        await qr.query(`ALTER TYPE notifications_type_enum ADD VALUE IF NOT EXISTS 'payout_failed'`);
    }
    async down(_qr) {
        // PostgreSQL does not support removing enum values
    }
}
exports.AddNotificationTypes1774600000000 = AddNotificationTypes1774600000000;
//# sourceMappingURL=1774600000000-AddNotificationTypes.js.map