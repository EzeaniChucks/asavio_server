// src/services/notificationService.ts
import { AppDataSource } from "../config/database";
import { Notification, NotificationType } from "../entities/Notification";
import { User } from "../entities/User";
import { emailService } from "./emailService";
import { onlineUsers } from "../state/presence";
import { getIo } from "../state/ioInstance";

const notifRepo = () => AppDataSource.getRepository(Notification);
const userRepo = () => AppDataSource.getRepository(User);

/** Types that always trigger an email regardless of online status */
const ALWAYS_EMAIL = new Set<NotificationType>([
  "booking_confirmed",
  "booking_cancelled",
  "kyc_approved",
  "kyc_rejected",
  "kyc_submitted",
  "listing_submitted",
  "payout_transferred",
  "payout_failed",
]);

export const notificationService = {
  /** Create a notification and dispatch it: socket if online, email otherwise (30s delay). */
  async send(opts: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
    io?: any;
  }): Promise<Notification> {
    const { userId, type, title, body, data } = opts;
    const io = opts.io ?? getIo();

    const notif = notifRepo().create({ userId, type, title, body, data: data ?? null });
    const saved = await notifRepo().save(notif);

    if (io) {
      const isOnline = (onlineUsers.get(userId)?.size ?? 0) > 0;

      if (isOnline) {
        io.to(`user:${userId}`).emit("notification", saved);
      }

      if (!isOnline || ALWAYS_EMAIL.has(type)) {
        const delay = isOnline ? 0 : 30_000;
        setTimeout(async () => {
          try {
            const user = await userRepo().findOne({ where: { id: userId } });
            if (!user) return;
            await notificationService._sendEmail(user, type, title, body, data);
          } catch (err) {
            console.error("[Notification] Email dispatch error:", err);
          }
        }, delay);
      }
    }

    return saved;
  },

  async _sendEmail(
    user: User,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    if (!ALWAYS_EMAIL.has(type)) {
      const isOnline = (onlineUsers.get(user.id)?.size ?? 0) > 0;
      if (isOnline) return;
    }
    // Best-effort — never block notification delivery if email fails
    emailService.sendNotificationEmail({
      to: user.email,
      firstName: user.firstName,
      title,
      body,
      ctaUrl: data?.url,
      ctaLabel: data?.urlLabel,
    }).catch(console.error);
  },

  async getForUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    const qb = notifRepo()
      .createQueryBuilder("notif")
      .where("notif.userId = :userId", { userId })
      .orderBy("notif.createdAt", "DESC")
      .take(50);

    if (unreadOnly) qb.andWhere("notif.isRead = false");
    return qb.getMany();
  },

  async markRead(id: string, userId: string): Promise<void> {
    await notifRepo().update({ id, userId }, { isRead: true });
  },

  async markAllRead(userId: string): Promise<void> {
    await notifRepo()
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where("userId = :userId AND isRead = false", { userId })
      .execute();
  },

  async sendToAllAdmins(opts: {
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    const admins = await userRepo().find({ where: { role: "admin" } });
    await Promise.all(
      admins.map((admin) =>
        notificationService.send({ userId: admin.id, ...opts })
      )
    );
  },

  async getUnreadCount(userId: string): Promise<number> {
    return notifRepo().count({ where: { userId, isRead: false } });
  },
};
