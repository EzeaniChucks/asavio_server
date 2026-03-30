"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailjetProvider = void 0;
// src/services/email/mailjet.ts
const node_mailjet_1 = __importDefault(require("node-mailjet"));
const APP_NAME = "Asavio";
class MailjetProvider {
    constructor() {
        this.client = null;
    }
    getClient() {
        const apiKey = process.env.MAILJET_API_KEY;
        const apiSecret = process.env.MAILJET_API_SECRET;
        if (!apiKey || !apiSecret) {
            console.warn("[Email/Mailjet] MAILJET_API_KEY or MAILJET_API_SECRET not set — skipping send");
            return null;
        }
        if (!this.client) {
            this.client = new node_mailjet_1.default({ apiKey, apiSecret });
        }
        return this.client;
    }
    async send(payload) {
        const client = this.getClient();
        if (!client)
            return;
        const from = process.env.MAILJET_FROM_EMAIL || "noreply@asavio.rent";
        const message = {
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
exports.MailjetProvider = MailjetProvider;
//# sourceMappingURL=mailjet.js.map