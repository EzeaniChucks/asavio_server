"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = void 0;
// src/services/chatService.ts
const database_1 = require("../config/database");
const Conversation_1 = require("../entities/Conversation");
const Message_1 = require("../entities/Message");
const AppError_1 = require("../utils/AppError");
const convRepo = () => database_1.AppDataSource.getRepository(Conversation_1.Conversation);
const msgRepo = () => database_1.AppDataSource.getRepository(Message_1.Message);
exports.chatService = {
    async getOrCreateConversation(opts) {
        const { guestId, hostId, propertyId, vehicleId } = opts;
        const qb = convRepo()
            .createQueryBuilder("conv")
            .where("conv.guestId = :guestId", { guestId })
            .andWhere("conv.hostId = :hostId", { hostId });
        if (propertyId)
            qb.andWhere("conv.propertyId = :propertyId", { propertyId });
        else if (vehicleId)
            qb.andWhere("conv.vehicleId = :vehicleId", { vehicleId });
        const existing = await qb.getOne();
        if (existing)
            return existing;
        const conv = convRepo().create({
            guestId,
            hostId,
            propertyId: propertyId ?? null,
            vehicleId: vehicleId ?? null,
        });
        return convRepo().save(conv);
    },
    async getConversationsForUser(userId) {
        return convRepo()
            .createQueryBuilder("conv")
            .where("conv.guestId = :userId OR conv.hostId = :userId", { userId })
            .leftJoinAndSelect("conv.guest", "guest")
            .leftJoinAndSelect("conv.host", "host")
            .leftJoinAndSelect("conv.property", "property")
            .leftJoinAndSelect("conv.vehicle", "vehicle")
            .orderBy("conv.lastMessageAt", "DESC", "NULLS LAST")
            .getMany();
    },
    async getConversationById(id, userId) {
        const conv = await convRepo().findOne({
            where: { id },
            relations: ["guest", "host", "property", "vehicle"],
        });
        if (!conv)
            throw new AppError_1.AppError("Conversation not found", 404);
        if (conv.guestId !== userId && conv.hostId !== userId) {
            throw new AppError_1.AppError("Access denied", 403);
        }
        return conv;
    },
    async getMessages(conversationId, userId, limit = 50, before) {
        await exports.chatService.getConversationById(conversationId, userId);
        const qb = msgRepo()
            .createQueryBuilder("msg")
            .where("msg.conversationId = :conversationId", { conversationId })
            .leftJoinAndSelect("msg.sender", "sender")
            .orderBy("msg.createdAt", "DESC")
            .take(limit);
        if (before) {
            const cursor = await msgRepo().findOne({ where: { id: before } });
            if (cursor)
                qb.andWhere("msg.createdAt < :cursor", { cursor: cursor.createdAt });
        }
        const msgs = await qb.getMany();
        return msgs.reverse();
    },
    async saveMessage(opts) {
        const { conversationId, senderId, body } = opts;
        const conv = await convRepo().findOne({ where: { id: conversationId } });
        if (!conv)
            throw new AppError_1.AppError("Conversation not found", 404);
        if (conv.guestId !== senderId && conv.hostId !== senderId) {
            throw new AppError_1.AppError("Access denied", 403);
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
    async markMessagesRead(conversationId, userId) {
        await exports.chatService.getConversationById(conversationId, userId);
        await msgRepo()
            .createQueryBuilder()
            .update(Message_1.Message)
            .set({ isRead: true, readAt: new Date() })
            .where("conversationId = :conversationId", { conversationId })
            .andWhere("senderId != :userId", { userId })
            .andWhere("isRead = false")
            .execute();
    },
    async getUnreadCount(userId) {
        const convs = await convRepo()
            .createQueryBuilder("conv")
            .where("conv.guestId = :userId OR conv.hostId = :userId", { userId })
            .select("conv.id")
            .getMany();
        if (!convs.length)
            return 0;
        const convIds = convs.map((c) => c.id);
        return msgRepo()
            .createQueryBuilder("msg")
            .where("msg.conversationId IN (:...convIds)", { convIds })
            .andWhere("msg.senderId != :userId", { userId })
            .andWhere("msg.isRead = false")
            .getCount();
    },
};
//# sourceMappingURL=chatService.js.map