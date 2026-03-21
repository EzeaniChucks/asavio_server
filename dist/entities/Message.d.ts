import { User } from "./User";
import { Conversation } from "./Conversation";
export declare class Message {
    id: string;
    conversation: Conversation;
    conversationId: string;
    sender: User;
    senderId: string;
    body: string;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
}
//# sourceMappingURL=Message.d.ts.map