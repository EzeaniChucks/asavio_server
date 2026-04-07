"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supportService = void 0;
// src/services/supportService.ts
const database_1 = require("../config/database");
const SupportTicket_1 = require("../entities/SupportTicket");
const User_1 = require("../entities/User");
const AppError_1 = require("../utils/AppError");
const emailService_1 = require("./emailService");
const notificationService_1 = require("./notificationService");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "asavioluxury@gmail.com";
class SupportService {
    get repo() {
        return database_1.AppDataSource.getRepository(SupportTicket_1.SupportTicket);
    }
    // ── Guest: submit a ticket ────────────────────────────────────────────────
    async createTicket(userId, input) {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new AppError_1.AppError("User not found", 404);
        const ticket = this.repo.create({
            userId,
            subject: input.subject.trim(),
            category: input.category,
            message: input.message.trim(),
            status: "open",
        });
        const saved = await this.repo.save(ticket);
        // Confirmation email to guest
        emailService_1.emailService.sendSupportTicketReceived({
            to: user.email,
            firstName: user.firstName,
            subject: saved.subject,
            ticketId: saved.id,
        }).catch(console.error);
        // Alert email to admin inbox
        emailService_1.emailService.sendAdminSupportAlert({
            to: ADMIN_EMAIL,
            guestName: `${user.firstName} ${user.lastName}`,
            guestEmail: user.email,
            subject: saved.subject,
            category: saved.category,
            message: saved.message,
            ticketId: saved.id,
        }).catch(console.error);
        // In-app notification to all admins
        notificationService_1.notificationService.sendToAllAdmins({
            type: "support_ticket",
            title: "New support ticket",
            body: `${user.firstName} ${user.lastName} submitted: "${saved.subject}"`,
            data: { url: `/dashboard/admin/support?ticket=${saved.id}`, urlLabel: "View ticket" },
        }).catch(console.error);
        return saved;
    }
    // ── Guest: list own tickets ───────────────────────────────────────────────
    async getMyTickets(userId) {
        return this.repo.find({
            where: { userId },
            order: { createdAt: "DESC" },
        });
    }
    async getMyTicket(userId, ticketId) {
        const ticket = await this.repo.findOne({ where: { id: ticketId, userId } });
        if (!ticket)
            throw new AppError_1.AppError("Ticket not found", 404);
        return ticket;
    }
    // ── Admin: list all tickets ───────────────────────────────────────────────
    async getTickets(opts) {
        const { page = 1, status } = opts;
        const limit = Math.min(opts.limit ?? 20, 100);
        const qb = this.repo
            .createQueryBuilder("t")
            .leftJoinAndSelect("t.user", "user")
            .orderBy("t.createdAt", "DESC");
        if (status)
            qb.andWhere("t.status = :status", { status });
        const total = await qb.getCount();
        const tickets = await qb.skip((page - 1) * limit).take(limit).getMany();
        return { tickets, total };
    }
    async getTicket(ticketId) {
        const ticket = await this.repo.findOne({
            where: { id: ticketId },
            relations: ["user"],
        });
        if (!ticket)
            throw new AppError_1.AppError("Ticket not found", 404);
        return ticket;
    }
    // ── Admin: respond to a ticket ────────────────────────────────────────────
    async respondToTicket(adminId, ticketId, input) {
        const ticket = await this.repo.findOne({
            where: { id: ticketId },
            relations: ["user"],
        });
        if (!ticket)
            throw new AppError_1.AppError("Ticket not found", 404);
        ticket.adminResponse = input.response.trim();
        ticket.status = input.status;
        ticket.respondedAt = new Date();
        ticket.respondedByAdminId = adminId;
        const saved = await this.repo.save(ticket);
        // Email response to guest
        emailService_1.emailService.sendSupportTicketResponse({
            to: ticket.user.email,
            firstName: ticket.user.firstName,
            subject: ticket.subject,
            response: input.response,
            ticketId: ticket.id,
        }).catch(console.error);
        // In-app notification to guest
        notificationService_1.notificationService.send({
            userId: ticket.userId,
            type: "support_ticket",
            title: "Response to your support request",
            body: `The support team has responded to: "${ticket.subject}"`,
            data: { url: `/support?ticket=${ticket.id}`, urlLabel: "View response" },
        }).catch(console.error);
        return saved;
    }
    // ── Admin: update status only (no response text) ─────────────────────────
    async updateTicketStatus(ticketId, status) {
        const ticket = await this.repo.findOne({ where: { id: ticketId } });
        if (!ticket)
            throw new AppError_1.AppError("Ticket not found", 404);
        await this.repo.update(ticketId, { status });
        return { ...ticket, status };
    }
}
exports.supportService = new SupportService();
//# sourceMappingURL=supportService.js.map