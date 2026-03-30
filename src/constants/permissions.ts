// src/constants/permissions.ts

export const ADMIN_PERMISSIONS = {
  MANAGE_USERS:      "manage_users",
  MANAGE_PROPERTIES: "manage_properties",
  MANAGE_VEHICLES:   "manage_vehicles",
  MANAGE_BOOKINGS:   "manage_bookings",
  MANAGE_PAYOUTS:    "manage_payouts",
  MANAGE_REVIEWS:    "manage_reviews",
  MANAGE_MARKETING:  "manage_marketing",
  MANAGE_SETTINGS:   "manage_settings",
  MANAGE_KYC:        "manage_kyc",
  MANAGE_ADMINS:     "manage_admins",
  VIEW_AUDIT_LOGS:   "view_audit_logs",
} as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export const ALL_PERMISSIONS: AdminPermission[] = Object.values(ADMIN_PERMISSIONS);

export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  manage_users:      "Manage Users",
  manage_properties: "Manage Properties",
  manage_vehicles:   "Manage Vehicles",
  manage_bookings:   "Manage Bookings",
  manage_payouts:    "Manage Payouts",
  manage_reviews:    "Manage Reviews",
  manage_marketing:  "Send Marketing Emails",
  manage_settings:   "Platform Settings",
  manage_kyc:        "KYC Review",
  manage_admins:     "Admin Management (IAM)",
  view_audit_logs:   "View Audit Logs",
};
