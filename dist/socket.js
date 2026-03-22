"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onlineUsers = void 0;
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("./config/database");
const User_1 = require("./entities/User");
const Conversation_1 = require("./entities/Conversation");
const chatService_1 = require("./services/chatService");
const notificationService_1 = require("./services/notificationService");
const hostTierService_1 = require("./services/hostTierService");
const presence_1 = require("./state/presence");
Object.defineProperty(exports, "onlineUsers", { enumerable: true, get: function () { return presence_1.onlineUsers; } });
const ioInstance_1 = require("./state/ioInstance");
function initSocket(httpServer) {
    const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
        .split(",")
        .map((o) => o.trim());
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, callback) => {
                // Allow same-origin requests (no Origin header) and any listed origin
                if (!origin || allowedOrigins.includes(origin))
                    return callback(null, true);
                callback(new Error(`Socket.io CORS: origin ${origin} not allowed`));
            },
            credentials: true,
        },
    });
    (0, ioInstance_1.setIo)(io);
    // ── JWT auth middleware ──────────────────────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers.authorization?.replace("Bearer ", "");
            if (!token)
                return next(new Error("Authentication required"));
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "secret");
            const user = await database_1.AppDataSource.getRepository(User_1.User).findOne({
                where: { id: decoded.id },
            });
            if (!user)
                return next(new Error("User not found"));
            socket.user = user;
            next();
        }
        catch {
            next(new Error("Invalid token"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.user;
        // Track presence
        if (!presence_1.onlineUsers.has(user.id))
            presence_1.onlineUsers.set(user.id, new Set());
        presence_1.onlineUsers.get(user.id).add(socket.id);
        socket.join(`user:${user.id}`);
        io.emit("user:online", { userId: user.id });
        // ── Join conversation room ─────────────────────────────────────────────────
        socket.on("join_conversation", async (conversationId) => {
            try {
                await chatService_1.chatService.getConversationById(conversationId, user.id);
                socket.join(`conv:${conversationId}`);
            }
            catch {
                socket.emit("error", { message: "Conversation not found or access denied" });
            }
        });
        // ── Send message ───────────────────────────────────────────────────────────
        socket.on("send_message", async (payload) => {
            try {
                const { conversationId, body } = payload;
                if (!body?.trim())
                    return;
                const msg = await chatService_1.chatService.saveMessage({
                    conversationId,
                    senderId: user.id,
                    body: body.trim(),
                });
                io.to(`conv:${conversationId}`).emit("new_message", msg);
                const conv = await database_1.AppDataSource.getRepository(Conversation_1.Conversation).findOne({
                    where: { id: conversationId },
                });
                if (!conv)
                    return;
                const recipientId = conv.guestId === user.id ? conv.hostId : conv.guestId;
                await notificationService_1.notificationService.send({
                    userId: recipientId,
                    type: "message",
                    title: `New message from ${user.firstName}`,
                    body: body.trim().slice(0, 100),
                    data: { conversationId, url: `/dashboard/messages?conv=${conversationId}` },
                    io,
                });
                // Recompute host tier after host reply (updates response rate)
                if (user.id === conv.hostId) {
                    hostTierService_1.hostTierService.recompute(user.id).catch(console.error);
                }
            }
            catch (err) {
                socket.emit("error", { message: "Failed to send message" });
                console.error("[Socket] send_message error:", err);
            }
        });
        // ── Mark messages read ─────────────────────────────────────────────────────
        socket.on("mark_read", async (conversationId) => {
            try {
                await chatService_1.chatService.markMessagesRead(conversationId, user.id);
                socket.to(`conv:${conversationId}`).emit("messages_read", {
                    conversationId,
                    userId: user.id,
                });
            }
            catch {
                // Non-critical — silently ignore
            }
        });
        // ── Typing indicators ──────────────────────────────────────────────────────
        socket.on("typing_start", (conversationId) => {
            socket.to(`conv:${conversationId}`).emit("user_typing", {
                conversationId,
                userId: user.id,
                firstName: user.firstName,
            });
        });
        socket.on("typing_stop", (conversationId) => {
            socket.to(`conv:${conversationId}`).emit("user_stopped_typing", {
                conversationId,
                userId: user.id,
            });
        });
        // ── Disconnect ─────────────────────────────────────────────────────────────
        socket.on("disconnect", async () => {
            const sockets = presence_1.onlineUsers.get(user.id);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    presence_1.onlineUsers.delete(user.id);
                    io.emit("user:offline", { userId: user.id });
                    try {
                        await database_1.AppDataSource.getRepository(User_1.User).update(user.id, {
                            lastSeen: new Date(),
                        });
                    }
                    catch {
                        // Non-critical
                    }
                }
            }
        });
    });
    return io;
}
//# sourceMappingURL=socket.js.map