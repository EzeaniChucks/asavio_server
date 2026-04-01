import type { EmailPayload, EmailProvider } from "./index";
export declare class MailgunProvider implements EmailProvider {
    private client;
    private getClient;
    send(payload: EmailPayload): Promise<void>;
}
//# sourceMappingURL=mailgun.d.ts.map