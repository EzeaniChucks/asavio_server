export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
    /** Optional reply-to address. Use for emails where a human reply is welcome. */
    replyTo?: string;
}
export interface EmailProvider {
    send(payload: EmailPayload): Promise<void>;
}
export declare function getProvider(): EmailProvider;
/** Call this in tests or when env vars change to force a fresh provider. */
export declare function resetProvider(): void;
//# sourceMappingURL=index.d.ts.map