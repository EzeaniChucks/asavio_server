// src/services/email/mailgun.ts
import Mailgun from "mailgun.js";
import FormData from "form-data";
import type { EmailPayload, EmailProvider } from "./index";

const APP_NAME = "Asavio";

export class MailgunProvider implements EmailProvider {
  private client: ReturnType<InstanceType<typeof Mailgun>["client"]> | null = null;

  private getClient() {
    const apiKey = process.env.MAILGUN_API_KEY;
    if (!apiKey) {
      console.warn("[Email/Mailgun] MAILGUN_API_KEY not set — skipping send");
      return null;
    }
    if (!this.client) {
      const mailgun = new Mailgun(FormData);
      this.client = mailgun.client({
        username: "api",
        key: apiKey,
        // Set MAILGUN_URL=https://api.eu.mailgun.net for EU region domains
        url: process.env.MAILGUN_URL || "https://api.mailgun.net",
      });
    }
    return this.client;
  }

  async send(payload: EmailPayload): Promise<void> {
    const client = this.getClient();
    if (!client) return;

    const domain = process.env.MAILGUN_DOMAIN;
    if (!domain) {
      console.warn("[Email/Mailgun] MAILGUN_DOMAIN not set — skipping send:", payload.subject);
      return;
    }

    const from = process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`;

    const data: Record<string, unknown> = {
      from: `${APP_NAME} <${from}>`,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
    };

    if (payload.replyTo) {
      data["h:Reply-To"] = payload.replyTo;
    }

    await client.messages.create(domain, data as any);
  }
}
