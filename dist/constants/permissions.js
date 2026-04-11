"use strict";
// src/constants/permissions.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.PERMISSION_LABELS = exports.ALL_PERMISSIONS = exports.ADMIN_PERMISSIONS = void 0;
exports.ADMIN_PERMISSIONS = {
    MANAGE_USERS: "manage_users",
    MANAGE_PROPERTIES: "manage_properties",
    MANAGE_VEHICLES: "manage_vehicles",
    MANAGE_BOOKINGS: "manage_bookings",
    MANAGE_PAYOUTS: "manage_payouts",
    MANAGE_REVIEWS: "manage_reviews",
    MANAGE_MARKETING: "manage_marketing",
    MANAGE_SETTINGS: "manage_settings",
    MANAGE_KYC: "manage_kyc",
    MANAGE_ADMINS: "manage_admins",
    VIEW_AUDIT_LOGS: "view_audit_logs",
    MANAGE_SUPPORT: "manage_support",
    MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
};
exports.ALL_PERMISSIONS = Object.values(exports.ADMIN_PERMISSIONS);
exports.PERMISSION_LABELS = {
    manage_users: "Manage Users",
    manage_properties: "Manage Properties",
    manage_vehicles: "Manage Vehicles",
    manage_bookings: "Manage Bookings",
    manage_payouts: "Manage Payouts",
    manage_reviews: "Manage Reviews",
    manage_marketing: "Send Marketing Emails",
    manage_settings: "Platform Settings",
    manage_kyc: "KYC Review",
    manage_admins: "Admin Management (IAM)",
    view_audit_logs: "View Audit Logs",
    manage_support: "Guest Support & Complaints",
    manage_subscriptions: "Subscriptions",
};
//# sourceMappingURL=permissions.js.map