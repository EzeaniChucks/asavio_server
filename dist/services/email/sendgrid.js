"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendGridProvider = void 0;
// src/services/email/sendgrid.ts
const mail_1 = __importDefault(require("@sendgrid/mail"));
class SendGridProvider {
    async send(payload) {
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            console.warn("[Email/SendGrid] SENDGRID_API_KEY not set — skipping send:", payload.subject);
            return;
        }
        mail_1.default.setApiKey(apiKey);
        const from = process.env.SENDGRID_FROM_EMAIL || "noreply@asavio.com";
        await mail_1.default.send({
            ...payload,
            from,
            ...(payload.replyTo ? { replyTo: payload.replyTo } : {}),
        });
    }
}
exports.SendGridProvider = SendGridProvider;
//# sourceMappingURL=sendgrid.js.map