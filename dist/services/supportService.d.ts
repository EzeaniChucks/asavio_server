import { SupportTicket, TicketStatus } from "../entities/SupportTicket";
declare class SupportService {
    private get repo();
    createTicket(userId: string, input: {
        subject: string;
        category: SupportTicket["category"];
        message: string;
    }): Promise<SupportTicket>;
    getMyTickets(userId: string): Promise<SupportTicket[]>;
    getMyTicket(userId: string, ticketId: string): Promise<SupportTicket>;
    getTickets(opts: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        tickets: SupportTicket[];
        total: number;
    }>;
    getTicket(ticketId: string): Promise<SupportTicket>;
    respondToTicket(adminId: string, ticketId: string, input: {
        response: string;
        status: TicketStatus;
    }): Promise<SupportTicket>;
    updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket>;
}
export declare const supportService: SupportService;
export {};
//# sourceMappingURL=supportService.d.ts.map