"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailgunProvider = void 0;
// src/services/email/mailgun.ts
const mailgun_js_1 = __importDefault(require("mailgun.js"));
const form_data_1 = __importDefault(require("form-data"));
const APP_NAME = "Asavio";
class MailgunProvider {
    constructor() {
        this.client = null;
    }
    getClient() {
        const apiKey = process.env.MAILGUN_API_KEY;
        if (!apiKey) {
            console.warn("[Email/Mailgun] MAILGUN_API_KEY not set — skipping send");
            return null;
        }
        if (!this.client) {
            const mailgun = new mailgun_js_1.default(form_data_1.default);
            this.client = mailgun.client({
                username: "api",
                key: apiKey,
                // Set MAILGUN_URL=https://api.eu.mailgun.net for EU region domains
                url: process.env.MAILGUN_URL || "https://api.mailgun.net",
            });
        }
        return this.client;
    }
    async send(payload) {
        const client = this.getClient();
        if (!client)
            return;
        const domain = process.env.MAILGUN_DOMAIN;
        if (!domain) {
            console.warn("[Email/Mailgun] MAILGUN_DOMAIN not set — skipping send:", payload.subject);
            return;
        }
        const from = process.env.MAILGUN_FROM_EMAIL || `noreply@${domain}`;
        const data = {
            from: `${APP_NAME} <${from}>`,
            to: [payload.to],
            subject: payload.subject,
            html: payload.html,
        };
        if (payload.replyTo) {
            data["h:Reply-To"] = payload.replyTo;
        }
        await client.messages.create(domain, data);
    }
}
exports.MailgunProvider = MailgunProvider;
//# sourceMappingURL=mailgun.js.map