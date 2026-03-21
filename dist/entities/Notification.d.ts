import { User } from "./User";
export type NotificationType = "message" | "booking_request" | "booking_confirmed" | "booking_cancelled" | "booking_completed" | "review_received" | "kyc_approved" | "kyc_rejected" | "listing_approved" | "listing_rejected" | "payout_transferred";
export declare class Notification {
    id: string;
    user: User;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    /** Extra context — e.g. { conversationId, bookingId, propertyId } */
    data: Record<string, string> | null;
    isRead: boolean;
    createdAt: Date;
}
//# sourceMappingURL=Notification.d.ts.map