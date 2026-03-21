import { User } from "./User";
import { Property } from "./Property";
import { Vehicle } from "./Vehicle";
import { Message } from "./Message";
export declare class Conversation {
    id: string;
    guest: User;
    guestId: string;
    host: User;
    hostId: string;
    /** Optional — conversation is about a specific property */
    property: Property | null;
    propertyId: string | null;
    /** Optional — conversation is about a specific vehicle */
    vehicle: Vehicle | null;
    vehicleId: string | null;
    messages: Message[];
    /** Updated whenever a new message is sent — drives conversation list ordering */
    lastMessageAt: Date | null;
    /** Preview text for conversation list */
    lastMessagePreview: string | null;
    /** When the guest sent their FIRST message — for response-rate tracking */
    guestFirstMessageAt: Date | null;
    /** When the host sent their FIRST reply — for response-rate tracking */
    hostFirstReplyAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=Conversation.d.ts.map