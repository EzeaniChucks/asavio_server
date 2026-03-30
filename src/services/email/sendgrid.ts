// src/services/email/sendgrid.ts
import sgMail from "@sendgrid/mail";
import type { EmailPayload, EmailProvider } from "./index";

export class SendGridProvider implements EmailProvider {
  async send(payload: EmailPayload): Promise<void> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      console.warn("[Email/SendGrid] SENDGRID_API_KEY not set — skipping send:", payload.subject);
      return;
    }

    sgMail.setApiKey(apiKey);
    const from = process.env.SENDGRID_FROM_EMAIL || "noreply@asavio.com";

    await sgMail.send({
      ...payload,
      from,
      ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
    });
  }
}
