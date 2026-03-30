// src/services/email/index.ts
//
// To add a new email provider:
//   1. Create server/src/services/email/<name>.ts implementing EmailProvider
//   2. Add a case in getProvider() below
//   3. Set EMAIL_PROVIDER=<name> in your .env
//

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

// Lazy singleton — provider is created once on first call so env vars are
// read at runtime, not at module load time.
let _provider: EmailProvider | null = null;

export function getProvider(): EmailProvider {
  if (_provider) return _provider;

  const name = (process.env.EMAIL_PROVIDER || "mailjet").toLowerCase().trim();

  switch (name) {
    case "sendgrid": {
      const { SendGridProvider } = require("./sendgrid");
      _provider = new SendGridProvider();
      break;
    }
    case "mailjet":
    default: {
      const { MailjetProvider } = require("./mailjet");
      _provider = new MailjetProvider();
      break;
    }
  }

  console.log(`[Email] Provider: ${name}`);
  return _provider!;
}

/** Call this in tests or when env vars change to force a fresh provider. */
export function resetProvider(): void {
  _provider = null;
}
