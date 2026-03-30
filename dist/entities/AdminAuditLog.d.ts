export declare class AdminAuditLog {
    id: string;
    adminId: string;
    adminEmail: string;
    adminName: string;
    /** e.g. "approve_property", "delete_user", "create_admin" */
    action: string;
    /** e.g. "property", "user", "booking" */
    targetType: string;
    targetId: string;
    details: Record<string, any> | null;
    createdAt: Date;
}
//# sourceMappingURL=AdminAuditLog.d.ts.map