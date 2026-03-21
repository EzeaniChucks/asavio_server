import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
export declare const chatService: {
    getOrCreateConversation(opts: {
        guestId: string;
        hostId: string;
        propertyId?: string | null;
        vehicleId?: string | null;
    }): Promise<Conversation>;
    getConversationsForUser(userId: string): Promise<Conversation[]>;
    getConversationById(id: string, userId: string): Promise<Conversation>;
    getMessages(conversationId: string, userId: string, limit?: number, before?: string): Promise<Message[]>;
    saveMessage(opts: {
        conversationId: string;
        senderId: string;
        body: string;
    }): Promise<Message>;
    markMessagesRead(conversationId: string, userId: string): Promise<void>;
    getUnreadCount(userId: string): Promise<number>;
};
//# sourceMappingURL=chatService.d.ts.map