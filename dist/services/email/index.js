"use strict";
// src/services/email/index.ts
//
// To add a new email provider:
//   1. Create server/src/services/email/<name>.ts implementing EmailProvider
//   2. Add a case in getProvider() below
//   3. Set EMAIL_PROVIDER=<name> in your .env
//
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = getProvider;
exports.resetProvider = resetProvider;
// Lazy singleton — provider is created once on first call so env vars are
// read at runtime, not at module load time.
let _provider = null;
function getProvider() {
    if (_provider)
        return _provider;
    const name = (process.env.EMAIL_PROVIDER || "mailgun").toLowerCase().trim();
    switch (name) {
        case "sendgrid": {
            const { SendGridProvider } = require("./sendgrid");
            _provider = new SendGridProvider();
            break;
        }
        case "mailjet": {
            const { MailjetProvider } = require("./mailjet");
            _provider = new MailjetProvider();
            break;
        }
        case "mailgun":
        default: {
            const { MailgunProvider } = require("./mailgun");
            _provider = new MailgunProvider();
            break;
        }
    }
    console.log(`[Email] Provider: ${name}`);
    return _provider;
}
/** Call this in tests or when env vars change to force a fresh provider. */
function resetProvider() {
    _provider = null;
}
//# sourceMappingURL=index.js.map