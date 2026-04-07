import { User } from "./User";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketCategory = "payment" | "booking" | "listing" | "account" | "other";
export declare class SupportTicket {
    id: string;
    user: User;
    userId: string;
    subject: string;
    category: TicketCategory;
    message: string;
    status: TicketStatus;
    adminResponse: string | null;
    respondedAt: Date | null;
    respondedByAdminId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=SupportTicket.d.ts.map