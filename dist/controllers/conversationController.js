"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationController = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const chatService_1 = require("../services/chatService");
const AppError_1 = require("../utils/AppError");
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
exports.conversationController = {
    /** GET /conversations */
    list: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const conversations = await chatService_1.chatService.getConversationsForUser(req.user.id);
        res.json({ status: "success", data: { conversations } });
    }),
    /** POST /conversations — start or retrieve an existing conversation */
    getOrCreate: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const { hostId, propertyId, vehicleId, hotelId, eventCenterId } = req.body;
        const guestId = req.user.id;
        if (!hostId)
            throw new AppError_1.AppError("hostId is required", 400);
        if (guestId === hostId)
            throw new AppError_1.AppError("You cannot message yourself", 400);
        const host = await database_1.AppDataSource.getRepository(User_1.User).findOne({ where: { id: hostId } });
        if (!host)
            throw new AppError_1.AppError("Host not found", 404);
        const conversation = await chatService_1.chatService.getOrCreateConversation({
            guestId,
            hostId,
            propertyId: propertyId ?? null,
            vehicleId: vehicleId ?? null,
            hotelId: hotelId ?? null,
            eventCenterId: eventCenterId ?? null,
        });
        res.json({ status: "success", data: { conversation } });
    }),
    /** GET /conversations/:id/messages */
    messages: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const id = req.params.id;
        const limit = Math.min(parseInt(req.query.limit || "50"), 100);
        const before = req.query.before;
        const messages = await chatService_1.chatService.getMessages(id, req.user.id, limit, before);
        res.json({ status: "success", data: { messages } });
    }),
    /** GET /conversations/unread-count */
    unreadCount: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const count = await chatService_1.chatService.getUnreadCount(req.user.id);
        res.json({ status: "success", data: { count } });
    }),
};
//# sourceMappingURL=conversationController.js.map