// src/services/chatService.ts
import { AppDataSource } from "../config/database";
import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { AppError } from "../utils/AppError";

const convRepo = () => AppDataSource.getRepository(Conversation);
const msgRepo = () => AppDataSource.getRepository(Message);

export const chatService = {
  async getOrCreateConversation(opts: {
    guestId: string;
    hostId: string;
    propertyId?: string | null;
    vehicleId?: string | null;
    hotelId?: string | null;
    eventCenterId?: string | null;
  }): Promise<Conversation> {
    const { guestId, hostId, propertyId, vehicleId, hotelId, eventCenterId } = opts;

    const qb = convRepo()
      .createQueryBuilder("conv")
      .where("conv.guestId = :guestId", { guestId })
      .andWhere("conv.hostId = :hostId", { hostId });

    if (propertyId) qb.andWhere("conv.propertyId = :propertyId", { propertyId });
    else if (vehicleId) qb.andWhere("conv.vehicleId = :vehicleId", { vehicleId });
    else if (hotelId) qb.andWhere("conv.hotelId = :hotelId", { hotelId });
    else if (eventCenterId) qb.andWhere("conv.eventCenterId = :eventCenterId", { eventCenterId });

    const existing = await qb.getOne();
    if (existing) return existing;

    const conv = convRepo().create({
      guestId,
      hostId,
      propertyId: propertyId ?? null,
      vehicleId: vehicleId ?? null,
      hotelId: hotelId ?? null,
      eventCenterId: eventCenterId ?? null,
    });
    return convRepo().save(conv);
  },

  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    return convRepo()
      .createQueryBuilder("conv")
      .where("conv.guestId = :userId OR conv.hostId = :userId", { userId })
      .leftJoinAndSelect("conv.guest", "guest")
      .leftJoinAndSelect("conv.host", "host")
      .leftJoinAndSelect("conv.property", "property")
      .leftJoinAndSelect("conv.vehicle", "vehicle")
      .leftJoinAndSelect("conv.hotel", "hotel")
      .leftJoinAndSelect("conv.eventCenter", "eventCenter")
      .orderBy("conv.lastMessageAt", "DESC", "NULLS LAST")
      .getMany();
  },

  async getConversationById(id: string, userId: string): Promise<Conversation> {
    const conv = await convRepo().findOne({
      where: { id },
      relations: ["guest", "host", "property", "vehicle"],
    });
    if (!conv) throw new AppError("Conversation not found", 404);
    if (conv.guestId !== userId && conv.hostId !== userId) {
      throw new AppError("Access denied", 403);
    }
    return conv;
  },

  async getMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    before?: string
  ): Promise<Message[]> {
    await chatService.getConversationById(conversationId, userId);

    const qb = msgRepo()
      .createQueryBuilder("msg")
      .where("msg.conversationId = :conversationId", { conversationId })
      .leftJoinAndSelect("msg.sender", "sender")
      .orderBy("msg.createdAt", "DESC")
      .take(limit);

    if (before) {
      const cursor = await msgRepo().findOne({ where: { id: before } });
      if (cursor) qb.andWhere("msg.createdAt < :cursor", { cursor: cursor.createdAt });
    }

    const msgs = await qb.getMany();
    return msgs.reverse();
  },

  async saveMessage(opts: {
    conversationId: string;
    senderId: string;
    body: string;
  }): Promise<Message> {
    const { conversationId, senderId, body } = opts;

    const conv = await convRepo().findOne({ where: { id: conversationId } });
    if (!conv) throw new AppError("Conversation not found", 404);
    if (conv.guestId !== senderId && conv.hostId !== senderId) {
      throw new AppError("Access denied", 403);
    }

    const msg = msgRepo().create({ conversationId, senderId, body });
    const saved = await msgRepo().save(msg);

    await convRepo().update(conversationId, {
      lastMessageAt: saved.createdAt,
      lastMessagePreview: body.length > 120 ? body.slice(0, 117) + "..." : body,
    });

    if (senderId === conv.guestId && !conv.guestFirstMessageAt) {
      await convRepo().update(conversationId, { guestFirstMessageAt: saved.createdAt });
    }
    if (senderId === conv.hostId && !conv.hostFirstReplyAt && conv.guestFirstMessageAt) {
      await convRepo().update(conversationId, { hostFirstReplyAt: saved.createdAt });
    }

    return saved;
  },

  async markMessagesRead(conversationId: string, userId: string): Promise<void> {
    await chatService.getConversationById(conversationId, userId);

    await msgRepo()
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true, readAt: new Date() })
      .where("conversationId = :conversationId", { conversationId })
      .andWhere("senderId != :userId", { userId })
      .andWhere("isRead = false")
      .execute();
  },

  async getUnreadCount(userId: string): Promise<number> {
    const convs = await convRepo()
      .createQueryBuilder("conv")
      .where("conv.guestId = :userId OR conv.hostId = :userId", { userId })
      .select("conv.id")
      .getMany();

    if (!convs.length) return 0;

    const convIds = convs.map((c) => c.id);
    return msgRepo()
      .createQueryBuilder("msg")
      .where("msg.conversationId IN (:...convIds)", { convIds })
      .andWhere("msg.senderId != :userId", { userId })
      .andWhere("msg.isRead = false")
      .getCount();
  },
};
