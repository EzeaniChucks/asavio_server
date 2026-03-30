// src/services/email/mailjet.ts
import Mailjet from "node-mailjet";
import type { EmailPayload, EmailProvider } from "./index";

const APP_NAME = "Asavio";

export class MailjetProvider implements EmailProvider {
  private client: Mailjet | null = null;

  private getClient(): Mailjet | null {
    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_API_SECRET;
    if (!apiKey || !apiSecret) {
      console.warn("[Email/Mailjet] MAILJET_API_KEY or MAILJET_API_SECRET not set — skipping send");
      return null;
    }
    if (!this.client) {
      this.client = new Mailjet({ apiKey, apiSecret });
    }
    return this.client;
  }

  async send(payload: EmailPayload): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    const from = process.env.MAILJET_FROM_EMAIL || "noreply@asavio.rent";

    const message: Record<string, unknown> = {
      From: { Email: from, Name: APP_NAME },
      To: [{ Email: payload.to }],
      Subject: payload.subject,
      HTMLPart: payload.html,
    };

    if (payload.replyTo) {
      message.ReplyTo = { Email: payload.replyTo };
    }

    await client.post("send", { version: "v3.1" }).request({ Messages: [message] });
  }
}
