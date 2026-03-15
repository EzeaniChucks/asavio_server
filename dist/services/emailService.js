"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = void 0;
// src/services/emailService.ts
const mail_1 = __importDefault(require("@sendgrid/mail"));
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY || "");
const FROM = process.env.SENDGRID_FROM_EMAIL || "noreply@asavio.com";
const APP_NAME = "Asavio";
async function send(payload) {
    if (!process.env.SENDGRID_API_KEY) {
        console.warn("[Email] SENDGRID_API_KEY not set — skipping send:", payload.subject);
        return;
    }
    await mail_1.default.send({ ...payload, from: FROM });
}
// ── Templates ────────────────────────────────────────────────────
function wrap(body) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: -apple-system, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
        .card { background: #fff; max-width: 560px; margin: 40px auto; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
        .header { background: #000; color: #FFD700; padding: 28px 32px; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .body { padding: 32px; color: #374151; line-height: 1.6; }
        .btn { display: inline-block; background: #000; color: #fff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
        .footer { padding: 20px 32px; font-size: 12px; color: #9CA3AF; border-top: 1px solid #F3F4F6; }
        .pill { display: inline-block; background: #F3F4F6; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; }
        .divider { border: none; border-top: 1px solid #F3F4F6; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">${APP_NAME}</div>
        <div class="body">${body}</div>
        <div class="footer">© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</div>
      </div>
    </body>
    </html>
  `;
}
exports.emailService = {
    async sendWelcome(to, firstName) {
        await send({
            to,
            subject: `Welcome to ${APP_NAME}, ${firstName}!`,
            html: wrap(`
        <h2 style="margin-top:0">Welcome, ${firstName}! 🎉</h2>
        <p>Your account has been created. Start browsing our curated shortlets and luxury vehicles.</p>
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/properties" class="btn">Browse properties</a>
      `),
        });
    },
    async sendBookingConfirmation(opts) {
        const { to, firstName, propertyTitle, checkIn, checkOut, nights, totalPrice, bookingId } = opts;
        await send({
            to,
            subject: `Booking confirmed – ${propertyTitle}`,
            html: wrap(`
        <h2 style="margin-top:0">Your booking is confirmed! ✅</h2>
        <p>Hi ${firstName}, your stay has been confirmed.</p>
        <hr class="divider" />
        <p><strong>Property:</strong> ${propertyTitle}</p>
        <p><strong>Check-in:</strong> ${checkIn}</p>
        <p><strong>Check-out:</strong> ${checkOut}</p>
        <p><strong>Duration:</strong> ${nights} night${nights !== 1 ? "s" : ""}</p>
        <p><strong>Total:</strong> $${totalPrice.toFixed(2)}</p>
        <hr class="divider" />
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${bookingId}" class="btn">View booking</a>
      `),
        });
    },
    async sendBookingStatusUpdate(opts) {
        const { to, firstName, propertyTitle, status, bookingId } = opts;
        const statusLabel = {
            confirmed: "confirmed ✅",
            cancelled: "cancelled ❌",
            completed: "completed 🏆",
        };
        await send({
            to,
            subject: `Booking ${status} – ${propertyTitle}`,
            html: wrap(`
        <h2 style="margin-top:0">Booking update</h2>
        <p>Hi ${firstName}, your booking for <strong>${propertyTitle}</strong> has been <strong>${statusLabel[status] ?? status}</strong>.</p>
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/bookings/${bookingId}" class="btn">View booking</a>
      `),
        });
    },
    async sendHostNewBooking(opts) {
        const { to, hostName, guestName, propertyTitle, checkIn, checkOut, guests, bookingId } = opts;
        await send({
            to,
            subject: `New booking request – ${propertyTitle}`,
            html: wrap(`
        <h2 style="margin-top:0">New booking request 📩</h2>
        <p>Hi ${hostName}, <strong>${guestName}</strong> has requested to book your property.</p>
        <hr class="divider" />
        <p><strong>Property:</strong> ${propertyTitle}</p>
        <p><strong>Check-in:</strong> ${checkIn}</p>
        <p><strong>Check-out:</strong> ${checkOut}</p>
        <p><strong>Guests:</strong> ${guests}</p>
        <hr class="divider" />
        <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/host" class="btn">View in dashboard</a>
      `),
        });
    },
    async sendAdminBroadcast(opts) {
        await send({
            to: opts.to,
            subject: opts.subject,
            html: wrap(`
        <p>${opts.message.replace(/\n/g, "<br />")}</p>
      `),
        });
    },
    async sendPasswordReset(to, firstName, resetUrl) {
        await send({
            to,
            subject: "Reset your password",
            html: wrap(`
        <h2 style="margin-top:0">Password reset request</h2>
        <p>Hi ${firstName}, we received a request to reset your password.</p>
        <a href="${resetUrl}" class="btn">Reset password</a>
        <p style="margin-top:20px;color:#6B7280;font-size:13px">This link expires in 1 hour. If you didn't request a reset, ignore this email.</p>
      `),
        });
    },
    async sendVerificationEmail(to, firstName, verifyUrl) {
        await send({
            to,
            subject: "Verify your email address",
            html: wrap(`
        <h2 style="margin-top:0">Verify your email</h2>
        <p>Hi ${firstName}, click the button below to verify your email address.</p>
        <a href="${verifyUrl}" class="btn">Verify email</a>
      `),
        });
    },
};
//# sourceMappingURL=emailService.js.map