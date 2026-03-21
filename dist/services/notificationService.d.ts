import { Notification, NotificationType } from "../entities/Notification";
import { User } from "../entities/User";
export declare const notificationService: {
    /** Create a notification and dispatch it: socket if online, email otherwise (30s delay). */
    send(opts: {
        userId: string;
        type: NotificationType;
        title: string;
        body: string;
        data?: Record<string, string>;
        io?: any;
    }): Promise<Notification>;
    _sendEmail(user: User, type: NotificationType, title: string, body: string, data?: Record<string, string>): Promise<void>;
    getForUser(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
    markRead(id: string, userId: string): Promise<void>;
    markAllRead(userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
};
//# sourceMappingURL=notificationService.d.ts.map