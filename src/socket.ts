// src/socket.ts
import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import { AppDataSource } from "./config/database";
import { User } from "./entities/User";
import { Conversation } from "./entities/Conversation";
import { chatService } from "./services/chatService";
import { notificationService } from "./services/notificationService";
import { hostTierService } from "./services/hostTierService";
import { onlineUsers } from "./state/presence";

export { onlineUsers };

export function initSocket(httpServer: HttpServer): SocketServer {
  const allowedOrigins = (process.env.FRONTEND_URL || "http://localhost:3000")
    .split(",")
    .map((o) => o.trim());

  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow same-origin requests (no Origin header) and any listed origin
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`Socket.io CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    },
  });

  // ── JWT auth middleware ──────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) return next(new Error("Authentication required"));

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "secret"
      ) as { id: string };

      const user = await AppDataSource.getRepository(User).findOne({
        where: { id: decoded.id },
      });
      if (!user) return next(new Error("User not found"));

      (socket as any).user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = (socket as any).user as User;

    // Track presence
    if (!onlineUsers.has(user.id)) onlineUsers.set(user.id, new Set());
    onlineUsers.get(user.id)!.add(socket.id);

    socket.join(`user:${user.id}`);
    io.emit("user:online", { userId: user.id });

    // ── Join conversation room ─────────────────────────────────────────────────
    socket.on("join_conversation", async (conversationId: string) => {
      try {
        await chatService.getConversationById(conversationId, user.id);
        socket.join(`conv:${conversationId}`);
      } catch {
        socket.emit("error", { message: "Conversation not found or access denied" });
      }
    });

    // ── Send message ───────────────────────────────────────────────────────────
    socket.on("send_message", async (payload: { conversationId: string; body: string }) => {
      try {
        const { conversationId, body } = payload;
        if (!body?.trim()) return;

        const msg = await chatService.saveMessage({
          conversationId,
          senderId: user.id,
          body: body.trim(),
        });

        io.to(`conv:${conversationId}`).emit("new_message", msg);

        const conv = await AppDataSource.getRepository(Conversation).findOne({
          where: { id: conversationId },
        });
        if (!conv) return;

        const recipientId = conv.guestId === user.id ? conv.hostId : conv.guestId;

        await notificationService.send({
          userId: recipientId,
          type: "message",
          title: `New message from ${user.firstName}`,
          body: body.trim().slice(0, 100),
          data: { conversationId, url: `/dashboard/messages?conv=${conversationId}` },
          io,
        });

        // Recompute host tier after host reply (updates response rate)
        if (user.id === conv.hostId) {
          hostTierService.recompute(user.id).catch(console.error);
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
        console.error("[Socket] send_message error:", err);
      }
    });

    // ── Mark messages read ─────────────────────────────────────────────────────
    socket.on("mark_read", async (conversationId: string) => {
      try {
        await chatService.markMessagesRead(conversationId, user.id);
        socket.to(`conv:${conversationId}`).emit("messages_read", {
          conversationId,
          userId: user.id,
        });
      } catch {
        // Non-critical — silently ignore
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────────
    socket.on("typing_start", (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit("user_typing", {
        conversationId,
        userId: user.id,
        firstName: user.firstName,
      });
    });

    socket.on("typing_stop", (conversationId: string) => {
      socket.to(`conv:${conversationId}`).emit("user_stopped_typing", {
        conversationId,
        userId: user.id,
      });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      const sockets = onlineUsers.get(user.id);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(user.id);
          io.emit("user:offline", { userId: user.id });
          try {
            await AppDataSource.getRepository(User).update(user.id, {
              lastSeen: new Date(),
            });
          } catch {
            // Non-critical
          }
        }
      }
    });
  });

  return io;
}
