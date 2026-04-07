export declare const ADMIN_PERMISSIONS: {
    readonly MANAGE_USERS: "manage_users";
    readonly MANAGE_PROPERTIES: "manage_properties";
    readonly MANAGE_VEHICLES: "manage_vehicles";
    readonly MANAGE_BOOKINGS: "manage_bookings";
    readonly MANAGE_PAYOUTS: "manage_payouts";
    readonly MANAGE_REVIEWS: "manage_reviews";
    readonly MANAGE_MARKETING: "manage_marketing";
    readonly MANAGE_SETTINGS: "manage_settings";
    readonly MANAGE_KYC: "manage_kyc";
    readonly MANAGE_ADMINS: "manage_admins";
    readonly VIEW_AUDIT_LOGS: "view_audit_logs";
    readonly MANAGE_SUPPORT: "manage_support";
};
export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];
export declare const ALL_PERMISSIONS: AdminPermission[];
export declare const PERMISSION_LABELS: Record<AdminPermission, string>;
//# sourceMappingURL=permissions.d.ts.map