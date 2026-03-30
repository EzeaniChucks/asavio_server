import type { EmailPayload, EmailProvider } from "./index";
export declare class MailjetProvider implements EmailProvider {
    private client;
    private getClient;
    send(payload: EmailPayload): Promise<void>;
}
//# sourceMappingURL=mailjet.d.ts.map