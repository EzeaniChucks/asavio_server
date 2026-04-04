// src/services/emailService.ts
import { getProvider } from "./email";

const APP_NAME = "Asavio";

/** Escape characters that are meaningful in HTML to prevent XSS. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// APP_URL is the canonical public URL used in email links (always production).
// Falls back to the first entry in FRONTEND_URL if APP_URL is not set.
const BASE_URL = process.env.APP_URL || (process.env.FRONTEND_URL || "http://localhost:3000").split(",")[0].trim();

// Reply-to addresses — replies from recipients land in a monitored inbox,
// not the noreply sender. Override via env vars if needed.
const REPLY = {
  hello:    process.env.REPLY_TO_HELLO    || "hello@asavio.app",    // welcome, friendly
  bookings: process.env.REPLY_TO_BOOKINGS || "bookings@asavio.app", // booking-related
  support:  process.env.REPLY_TO_SUPPORT  || "support@asavio.app",  // disputes, rejections
};

async function send(payload: { to: string; subject: string; html: string; replyTo?: string }): Promise<void> {
  await getProvider().send(payload);
}

// ── Brand template ───────────────────────────────────────────────────────────

function wrap(body: string): string {
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

// ── Templates ────────────────────────────────────────────────────────────────

export const emailService = {
  async sendWelcome(to: string, firstName: string): Promise<void> {
    await send({
      to,
      replyTo: REPLY.hello,
      subject: `Welcome to ${APP_NAME}, ${firstName}!`,
      html: wrap(`
        <h2 style="margin-top:0">Welcome, ${firstName}! 🎉</h2>
        <p>Your account has been created. Start browsing our curated shortlets and luxury vehicles.</p>
        <a href="${BASE_URL}/properties" class="btn">Browse properties</a>
      `),
    });
  },

  async sendBookingConfirmation(opts: {
    to: string;
    firstName: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: number;
    bookingId: string;
  }): Promise<void> {
    const { to, firstName, propertyTitle, checkIn, checkOut, nights, totalPrice, bookingId } = opts;
    await send({
      to,
      replyTo: REPLY.bookings,
      subject: `Booking confirmed – ${propertyTitle}`,
      html: wrap(`
        <h2 style="margin-top:0">Your booking is confirmed! ✅</h2>
        <p>Hi ${firstName}, your stay has been confirmed.</p>
        <hr class="divider" />
        <p><strong>Property:</strong> ${propertyTitle}</p>
        <p><strong>Check-in:</strong> ${checkIn}</p>
        <p><strong>Check-out:</strong> ${checkOut}</p>
        <p><strong>Duration:</strong> ${nights} night${nights !== 1 ? "s" : ""}</p>
        <p><strong>Total:</strong> ₦${Number(totalPrice).toLocaleString("en-NG")}</p>
        <hr class="divider" />
        <a href="${BASE_URL}/bookings/${bookingId}" class="btn">View booking</a>
      `),
    });
  },

  async sendBookingStatusUpdate(opts: {
    to: string;
    firstName: string;
    propertyTitle: string;
    status: string;
    bookingId: string;
  }): Promise<void> {
    const { to, firstName, propertyTitle, status, bookingId } = opts;
    const statusLabel: Record<string, string> = {
      confirmed: "confirmed ✅",
      cancelled: "cancelled ❌",
      completed: "completed 🏆",
    };
    await send({
      to,
      replyTo: status === "cancelled" ? REPLY.support : REPLY.bookings,
      subject: `Booking ${status} – ${propertyTitle}`,
      html: wrap(`
        <h2 style="margin-top:0">Booking update</h2>
        <p>Hi ${firstName}, your booking for <strong>${propertyTitle}</strong> has been <strong>${statusLabel[status] ?? status}</strong>.</p>
        <a href="${BASE_URL}/bookings/${bookingId}" class="btn">View booking</a>
      `),
    });
  },

  async sendHostNewBooking(opts: {
    to: string;
    hostName: string;
    guestName: string;
    propertyTitle: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
    totalPrice: number;
    platformCommission: number;
    hostPayout: number;
    commissionRate: number;
    bookingId: string;
  }): Promise<void> {
    const { to, hostName, guestName, propertyTitle, checkIn, checkOut, guests, nights, totalPrice, platformCommission, hostPayout, commissionRate, bookingId } = opts;
    const commissionPct = (commissionRate * 100).toFixed(0);
    await send({
      to,
      replyTo: REPLY.bookings,
      subject: `New booking request – ${propertyTitle}`,
      html: wrap(`
        <h2 style="margin-top:0">New booking request 📩</h2>
        <p>Hi ${hostName}, <strong>${guestName}</strong> has requested to book your property.</p>
        <hr class="divider" />
        <p><strong>Property:</strong> ${propertyTitle}</p>
        <p><strong>Check-in:</strong> ${checkIn}</p>
        <p><strong>Check-out:</strong> ${checkOut}</p>
        <p><strong>Guests:</strong> ${guests}</p>
        <p><strong>Duration:</strong> ${nights} night${nights !== 1 ? "s" : ""}</p>
        <hr class="divider" />
        <p style="font-size:15px;font-weight:600;margin-bottom:8px">Earnings breakdown</p>
        <p><strong>Guest pays:</strong> ₦${Number(totalPrice).toLocaleString("en-NG")}</p>
        <p style="color:#6B7280"><strong>Platform fee (${commissionPct}%):</strong> −₦${Number(platformCommission).toLocaleString("en-NG")}</p>
        <p style="font-size:16px;font-weight:700;color:#059669"><strong>Your payout:</strong> ₦${Number(hostPayout).toLocaleString("en-NG")}</p>
        <p style="font-size:12px;color:#9CA3AF">Payout is processed after the guest's check-in date. Payment is pending until the booking is confirmed.</p>
        <hr class="divider" />
        <a href="${BASE_URL}/dashboard/host" class="btn">View in dashboard</a>
      `),
    });
  },

  async sendAdminBroadcast(opts: {
    to: string;
    subject: string;
    message: string;
  }): Promise<void> {
    // Plain-text message — escape then convert newlines to <br>
    const safeMessage = escapeHtml(opts.message).replace(/\n/g, "<br />");
    await send({
      to: opts.to,
      subject: opts.subject,
      html: wrap(`<p>${safeMessage}</p>`),
    });
  },

  async sendCampaign(opts: {
    to: string;
    firstName: string;
    subject: string;
    htmlBody: string;
  }): Promise<void> {
    // htmlBody is trusted admin-authored HTML. Only escape the recipient's
    // firstName before substituting it so a crafted name can't inject markup.
    const safeName = escapeHtml(opts.firstName);
    const personalised = opts.htmlBody.replace(/\{\{firstName\}\}/g, safeName);
    await send({ to: opts.to, subject: opts.subject, html: wrap(personalised) });
  },

  async sendListingSubmitted(opts: {
    to: string;
    propertyTitle: string;
    hostName: string;
    propertyId: string;
  }): Promise<void> {
    const { to, propertyTitle, hostName } = opts;
    await send({
      to,
      subject: `New listing pending review — ${propertyTitle}`,
      html: wrap(`
        <h2 style="margin-top:0">New listing submitted for review</h2>
        <p><strong>${hostName}</strong> has submitted a new property listing and it is awaiting your approval.</p>
        <hr class="divider" />
        <p><strong>Listing:</strong> ${propertyTitle}</p>
        <hr class="divider" />
        <a href="${BASE_URL}/dashboard/admin/properties?status=pending" class="btn">Review in admin dashboard</a>
      `),
    });
  },

  async sendListingStatusUpdate(opts: {
    to: string;
    hostName: string;
    propertyTitle: string;
    status: "approved" | "rejected";
    rejectionReason?: string;
    propertyId: string;
  }): Promise<void> {
    const { to, hostName, propertyTitle, status, rejectionReason, propertyId } = opts;
    const approved = status === "approved";
    await send({
      to,
      replyTo: approved ? REPLY.hello : REPLY.support,
      subject: approved
        ? `Your listing is live — ${propertyTitle}`
        : `Listing not approved — ${propertyTitle}`,
      html: wrap(
        approved
          ? `
            <h2 style="margin-top:0">Your listing is live! 🎉</h2>
            <p>Hi ${hostName}, great news — <strong>${propertyTitle}</strong> has been approved and is now visible to guests.</p>
            <a href="${BASE_URL}/properties/${propertyId}" class="btn">View your listing</a>
          `
          : `
            <h2 style="margin-top:0">Listing not approved</h2>
            <p>Hi ${hostName}, unfortunately <strong>${propertyTitle}</strong> was not approved at this time.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
            <p>Please review the feedback, make the necessary updates, and resubmit your listing.</p>
            <a href="${BASE_URL}/dashboard/host" class="btn">Go to your dashboard</a>
          `
      ),
    });
  },

  async sendVehicleStatusUpdate(opts: {
    to: string;
    hostName: string;
    vehicleTitle: string;
    status: "approved" | "rejected";
    rejectionReason?: string;
    vehicleId: string;
  }): Promise<void> {
    const { to, hostName, vehicleTitle, status, rejectionReason, vehicleId } = opts;
    const approved = status === "approved";
    await send({
      to,
      replyTo: approved ? REPLY.hello : REPLY.support,
      subject: approved
        ? `Your vehicle listing is live — ${vehicleTitle}`
        : `Vehicle listing not approved — ${vehicleTitle}`,
      html: wrap(
        approved
          ? `
            <h2 style="margin-top:0">Your vehicle listing is live! 🎉</h2>
            <p>Hi ${hostName}, great news — <strong>${vehicleTitle}</strong> has been approved and is now visible to guests.</p>
            <a href="${BASE_URL}/vehicles/${vehicleId}" class="btn">View your listing</a>
          `
          : `
            <h2 style="margin-top:0">Vehicle listing not approved</h2>
            <p>Hi ${hostName}, unfortunately <strong>${vehicleTitle}</strong> was not approved at this time.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
            <p>Please review the feedback, make the necessary updates, and resubmit your listing.</p>
            <a href="${BASE_URL}/dashboard/host" class="btn">Go to your dashboard</a>
          `
      ),
    });
  },

  async sendKycSubmitted(opts: {
    to: string;
    hostName: string;
    hostEmail: string;
    documentType: string;
    userId: string;
  }): Promise<void> {
    const { to, hostName, hostEmail, documentType, userId } = opts;
    await send({
      to,
      subject: `KYC Verification Required — ${hostName}`,
      html: wrap(`
        <h2 style="margin-top:0;color:#DC2626">⚠️ KYC Submission — Action Required</h2>
        <p>A host has submitted identity documents and is awaiting your review.</p>
        <hr class="divider" />
        <p><strong>Host:</strong> ${hostName}</p>
        <p><strong>Email:</strong> ${hostEmail}</p>
        <p><strong>Document type:</strong> ${documentType}</p>
        <hr class="divider" />
        <p style="color:#DC2626;font-weight:600">This host's listings will remain hidden until you approve their KYC.</p>
        <a href="${BASE_URL}/dashboard/admin/kyc?userId=${userId}" class="btn" style="background:#DC2626">Review KYC →</a>
      `),
    });
  },

  async sendKycReviewed(opts: {
    to: string;
    hostName: string;
    decision: "approved" | "rejected";
    rejectionReason?: string;
  }): Promise<void> {
    const { to, hostName, decision, rejectionReason } = opts;
    const approved = decision === "approved";
    await send({
      to,
      replyTo: approved ? REPLY.hello : REPLY.support,
      subject: approved
        ? "Identity verified — You're ready to host on Asavio!"
        : "KYC verification unsuccessful",
      html: wrap(
        approved
          ? `
            <h2 style="margin-top:0">Identity verified ✅</h2>
            <p>Hi ${hostName}, your identity has been verified and your listings are now discoverable to guests on Asavio.</p>
            <a href="${BASE_URL}/dashboard/host" class="btn">Go to your dashboard</a>
          `
          : `
            <h2 style="margin-top:0">KYC not approved</h2>
            <p>Hi ${hostName}, unfortunately we were unable to verify your identity at this time.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
            <p>Please re-submit your documents with a valid, clearly legible government-issued ID.</p>
            <a href="${BASE_URL}/dashboard/host/kyc" class="btn">Re-submit documents</a>
          `
      ),
    });
  },

  async sendPasswordReset(to: string, firstName: string, resetUrl: string): Promise<void> {
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

  async sendAdminInvite(to: string, firstName: string, setPasswordUrl: string): Promise<void> {
    await send({
      to,
      replyTo: REPLY.hello,
      subject: `You've been added as an ${APP_NAME} admin`,
      html: wrap(`
        <h2 style="margin-top:0">Welcome to the ${APP_NAME} admin team</h2>
        <p>Hi ${firstName}, you've been granted admin access to the ${APP_NAME} platform.</p>
        <p>Click the button below to set your password and get started. This link expires in <strong>72 hours</strong>.</p>
        <a href="${setPasswordUrl}" class="btn">Set your password</a>
        <p style="margin-top:24px;color:#6B7280;font-size:13px">If you weren't expecting this, you can safely ignore this email.</p>
      `),
    });
  },

  async sendVerificationEmail(to: string, firstName: string, verifyUrl: string): Promise<void> {
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

  async sendCheckInInstructions(opts: {
    to: string;
    firstName: string;
    listingTitle: string;
    checkIn: string;
    checkOut: string;
    instructions: string;
    bookingId: string;
  }): Promise<void> {
    const { to, firstName, listingTitle, checkIn, checkOut, instructions, bookingId } = opts;
    const safeInstructions = escapeHtml(instructions).replace(/\n/g, "<br />");
    await send({
      to,
      replyTo: REPLY.bookings,
      subject: `Your check-in details — ${listingTitle}`,
      html: wrap(`
        <h2 style="margin-top:0">You're checking in tomorrow! 🎉</h2>
        <p>Hi ${firstName}, here are your check-in details for your upcoming stay.</p>
        <hr class="divider" />
        <p><strong>Listing:</strong> ${listingTitle}</p>
        <p><strong>Check-in:</strong> ${checkIn}</p>
        <p><strong>Check-out:</strong> ${checkOut}</p>
        <hr class="divider" />
        <p style="font-size:15px;font-weight:600;margin-bottom:8px">Access &amp; instructions</p>
        <p style="background:#F9FAFB;border-radius:8px;padding:16px;line-height:1.7">${safeInstructions}</p>
        <hr class="divider" />
        <a href="${BASE_URL}/bookings/${bookingId}" class="btn">View booking</a>
        <p style="margin-top:16px;font-size:12px;color:#9CA3AF">If you have any questions, reply to this email or use the messaging feature in the app.</p>
      `),
    });
  },

  async sendReviewNudge(opts: {
    to: string;
    firstName: string;
    listingTitle: string;
    bookingId: string;
    listingId: string;
    listingType: "property" | "vehicle";
  }): Promise<void> {
    const { to, firstName, listingTitle, bookingId, listingId, listingType } = opts;
    const reviewUrl = `${BASE_URL}/${listingType === "property" ? "properties" : "vehicles"}/${listingId}?review=1`;
    await send({
      to,
      replyTo: REPLY.hello,
      subject: `How was your stay at ${listingTitle}?`,
      html: wrap(`
        <h2 style="margin-top:0">How was your experience? ⭐</h2>
        <p>Hi ${firstName}, your stay at <strong>${listingTitle}</strong> has ended. We'd love to hear what you thought!</p>
        <p>Your review helps other guests make informed decisions and rewards great hosts.</p>
        <a href="${reviewUrl}" class="btn">Leave a review</a>
        <p style="margin-top:16px;font-size:12px;color:#9CA3AF">It only takes a minute. Thank you for being part of Asavio.</p>
      `),
    });
  },

  async sendNotificationEmail(opts: {
    to: string;
    firstName: string;
    title: string;
    body: string;
    ctaUrl?: string;
    ctaLabel?: string;
  }): Promise<void> {
    const { to, firstName, title, body, ctaUrl, ctaLabel } = opts;
    const base = BASE_URL;
    await send({
      to,
      subject: title,
      html: wrap(`
        <h2 style="margin-top:0">${title}</h2>
        <p>Hi ${firstName},</p>
        <p>${body}</p>
        ${ctaUrl ? `<a href="${base}${ctaUrl}" class="btn">${ctaLabel ?? "View"}</a>` : ""}
      `),
    });
  },

  // ── Subscription emails ───────────────────────────────────────────────────

  async sendSubscriptionConfirmation(opts: {
    to: string;
    firstName: string;
    tier: string;
    cycle: string;
    renewalDate: string;
  }): Promise<void> {
    const { to, firstName, tier, cycle, renewalDate } = opts;
    await send({
      to,
      replyTo: REPLY.hello,
      subject: `Your ${tier} plan is now active — ${APP_NAME}`,
      html: wrap(`
        <h2 style="margin-top:0">You're on ${APP_NAME} ${tier}! 🎉</h2>
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Your <strong>${escapeHtml(tier)}</strong> plan (${escapeHtml(cycle)}) is now active. Here's what you unlocked:</p>
        <ul>
          <li>Reduced platform commission</li>
          <li>More listing slots and photos per listing</li>
          ${tier === "Elite" ? "<li>Homepage featured placement</li>" : ""}
          ${tier !== "Starter" ? "<li>Feature video uploads per listing</li>" : ""}
        </ul>
        <p>Your plan renews on <strong>${escapeHtml(renewalDate)}</strong>.</p>
        <a href="${BASE_URL}/dashboard/host/subscription" class="btn">Manage subscription</a>
      `),
    });
  },

  async sendSubscriptionCancelled(opts: {
    to: string;
    firstName: string;
    tier: string;
    accessUntil: string;
  }): Promise<void> {
    const { to, firstName, tier, accessUntil } = opts;
    await send({
      to,
      replyTo: REPLY.support,
      subject: `Your ${tier} plan cancellation confirmed — ${APP_NAME}`,
      html: wrap(`
        <h2 style="margin-top:0">Subscription cancelled</h2>
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>Your <strong>${escapeHtml(tier)}</strong> plan has been cancelled. You'll keep access to all ${escapeHtml(tier)} features until <strong>${escapeHtml(accessUntil)}</strong>, after which your account will revert to the Starter tier.</p>
        <p>Changed your mind? You can resubscribe any time from your dashboard.</p>
        <a href="${BASE_URL}/dashboard/host/subscription" class="btn">View subscription</a>
      `),
    });
  },

  async sendSubscriptionPaymentFailed(opts: {
    to: string;
    firstName: string;
    tier: string;
  }): Promise<void> {
    const { to, firstName, tier } = opts;
    await send({
      to,
      replyTo: REPLY.support,
      subject: `Action needed: ${tier} plan renewal failed — ${APP_NAME}`,
      html: wrap(`
        <h2 style="margin-top:0">Payment failed</h2>
        <p>Hi ${escapeHtml(firstName)},</p>
        <p>We couldn't process the renewal payment for your <strong>${escapeHtml(tier)}</strong> plan. Please update your payment method to avoid losing access to your plan features.</p>
        <a href="${BASE_URL}/dashboard/host/subscription" class="btn">Update payment method</a>
      `),
    });
  },
};
