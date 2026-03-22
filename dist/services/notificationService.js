"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
// src/services/notificationService.ts
const database_1 = require("../config/database");
const Notification_1 = require("../entities/Notification");
const User_1 = require("../entities/User");
const emailService_1 = require("./emailService");
const presence_1 = require("../state/presence");
const ioInstance_1 = require("../state/ioInstance");
const notifRepo = () => database_1.AppDataSource.getRepository(Notification_1.Notification);
const userRepo = () => database_1.AppDataSource.getRepository(User_1.User);
/** Types that always trigger an email regardless of online status */
const ALWAYS_EMAIL = new Set([
    "booking_confirmed",
    "booking_cancelled",
    "kyc_approved",
    "kyc_rejected",
    "kyc_submitted",
    "listing_submitted",
    "payout_transferred",
    "payout_failed",
]);
exports.notificationService = {
    /** Create a notification and dispatch it: socket if online, email otherwise (30s delay). */
    async send(opts) {
        const { userId, type, title, body, data } = opts;
        const io = opts.io ?? (0, ioInstance_1.getIo)();
        const notif = notifRepo().create({ userId, type, title, body, data: data ?? null });
        const saved = await notifRepo().save(notif);
        if (io) {
            const isOnline = (presence_1.onlineUsers.get(userId)?.size ?? 0) > 0;
            if (isOnline) {
                io.to(`user:${userId}`).emit("notification", saved);
            }
            if (!isOnline || ALWAYS_EMAIL.has(type)) {
                const delay = isOnline ? 0 : 30000;
                setTimeout(async () => {
                    try {
                        const user = await userRepo().findOne({ where: { id: userId } });
                        if (!user)
                            return;
                        await exports.notificationService._sendEmail(user, type, title, body, data);
                    }
                    catch (err) {
                        console.error("[Notification] Email dispatch error:", err);
                    }
                }, delay);
            }
        }
        return saved;
    },
    async _sendEmail(user, type, title, body, data) {
        if (!ALWAYS_EMAIL.has(type)) {
            const isOnline = (presence_1.onlineUsers.get(user.id)?.size ?? 0) > 0;
            if (isOnline)
                return;
        }
        // Best-effort — never block notification delivery if email fails
        emailService_1.emailService.sendNotificationEmail({
            to: user.email,
            firstName: user.firstName,
            title,
            body,
            ctaUrl: data?.url,
            ctaLabel: data?.urlLabel,
        }).catch(console.error);
    },
    async getForUser(userId, unreadOnly = false) {
        const qb = notifRepo()
            .createQueryBuilder("notif")
            .where("notif.userId = :userId", { userId })
            .orderBy("notif.createdAt", "DESC")
            .take(50);
        if (unreadOnly)
            qb.andWhere("notif.isRead = false");
        return qb.getMany();
    },
    async markRead(id, userId) {
        await notifRepo().update({ id, userId }, { isRead: true });
    },
    async markAllRead(userId) {
        await notifRepo()
            .createQueryBuilder()
            .update(Notification_1.Notification)
            .set({ isRead: true })
            .where("userId = :userId AND isRead = false", { userId })
            .execute();
    },
    async sendToAllAdmins(opts) {
        const admins = await userRepo().find({ where: { role: "admin" } });
        await Promise.all(admins.map((admin) => exports.notificationService.send({ userId: admin.id, ...opts })));
    },
    async getUnreadCount(userId) {
        return notifRepo().count({ where: { userId, isRead: false } });
    },
};
//# sourceMappingURL=notificationService.js.map