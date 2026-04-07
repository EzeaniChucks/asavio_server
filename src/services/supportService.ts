// src/services/supportService.ts
import { AppDataSource } from "../config/database";
import { SupportTicket, TicketStatus } from "../entities/SupportTicket";
import { User } from "../entities/User";
import { AppError } from "../utils/AppError";
import { emailService } from "./emailService";
import { notificationService } from "./notificationService";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "asavioluxury@gmail.com";

class SupportService {
  private get repo() {
    return AppDataSource.getRepository(SupportTicket);
  }

  // ── Guest: submit a ticket ────────────────────────────────────────────────

  async createTicket(userId: string, input: {
    subject: string;
    category: SupportTicket["category"];
    message: string;
  }): Promise<SupportTicket> {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppError("User not found", 404);

    const ticket = this.repo.create({
      userId,
      subject: input.subject.trim(),
      category: input.category,
      message: input.message.trim(),
      status: "open",
    });
    const saved = await this.repo.save(ticket);

    // Confirmation email to guest
    emailService.sendSupportTicketReceived({
      to: user.email,
      firstName: user.firstName,
      subject: saved.subject,
      ticketId: saved.id,
    }).catch(console.error);

    // Alert email to admin inbox
    emailService.sendAdminSupportAlert({
      to: ADMIN_EMAIL,
      guestName: `${user.firstName} ${user.lastName}`,
      guestEmail: user.email,
      subject: saved.subject,
      category: saved.category,
      message: saved.message,
      ticketId: saved.id,
    }).catch(console.error);

    // In-app notification to all admins
    notificationService.sendToAllAdmins({
      type: "support_ticket",
      title: "New support ticket",
      body: `${user.firstName} ${user.lastName} submitted: "${saved.subject}"`,
      data: { url: `/dashboard/admin/support?ticket=${saved.id}`, urlLabel: "View ticket" },
    }).catch(console.error);

    return saved;
  }

  // ── Guest: list own tickets ───────────────────────────────────────────────

  async getMyTickets(userId: string): Promise<SupportTicket[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async getMyTicket(userId: string, ticketId: string): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({ where: { id: ticketId, userId } });
    if (!ticket) throw new AppError("Ticket not found", 404);
    return ticket;
  }

  // ── Admin: list all tickets ───────────────────────────────────────────────

  async getTickets(opts: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ tickets: SupportTicket[]; total: number }> {
    const { page = 1, status } = opts;
    const limit = Math.min(opts.limit ?? 20, 100);

    const qb = this.repo
      .createQueryBuilder("t")
      .leftJoinAndSelect("t.user", "user")
      .orderBy("t.createdAt", "DESC");

    if (status) qb.andWhere("t.status = :status", { status });

    const total = await qb.getCount();
    const tickets = await qb.skip((page - 1) * limit).take(limit).getMany();

    return { tickets, total };
  }

  async getTicket(ticketId: string): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({
      where: { id: ticketId },
      relations: ["user"],
    });
    if (!ticket) throw new AppError("Ticket not found", 404);
    return ticket;
  }

  // ── Admin: respond to a ticket ────────────────────────────────────────────

  async respondToTicket(adminId: string, ticketId: string, input: {
    response: string;
    status: TicketStatus;
  }): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({
      where: { id: ticketId },
      relations: ["user"],
    });
    if (!ticket) throw new AppError("Ticket not found", 404);

    ticket.adminResponse = input.response.trim();
    ticket.status = input.status;
    ticket.respondedAt = new Date();
    ticket.respondedByAdminId = adminId;

    const saved = await this.repo.save(ticket);

    // Email response to guest
    emailService.sendSupportTicketResponse({
      to: ticket.user.email,
      firstName: ticket.user.firstName,
      subject: ticket.subject,
      response: input.response,
      ticketId: ticket.id,
    }).catch(console.error);

    // In-app notification to guest
    notificationService.send({
      userId: ticket.userId,
      type: "support_ticket",
      title: "Response to your support request",
      body: `The support team has responded to: "${ticket.subject}"`,
      data: { url: `/support?ticket=${ticket.id}`, urlLabel: "View response" },
    }).catch(console.error);

    return saved;
  }

  // ── Admin: update status only (no response text) ─────────────────────────

  async updateTicketStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new AppError("Ticket not found", 404);
    await this.repo.update(ticketId, { status });
    return { ...ticket, status };
  }
}

export const supportService = new SupportService();
