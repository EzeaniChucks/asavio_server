"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const notificationService_1 = require("../services/notificationService");
exports.notificationController = {
    /** GET /notifications */
    list: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const unreadOnly = req.query.unread === "true";
        const notifications = await notificationService_1.notificationService.getForUser(req.user.id, unreadOnly);
        res.json({ status: "success", data: { notifications } });
    }),
    /** GET /notifications/unread-count */
    unreadCount: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const count = await notificationService_1.notificationService.getUnreadCount(req.user.id);
        res.json({ status: "success", data: { count } });
    }),
    /** PATCH /notifications/read-all */
    markAllRead: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await notificationService_1.notificationService.markAllRead(req.user.id);
        res.json({ status: "success", data: null });
    }),
    /** PATCH /notifications/:id/read */
    markRead: (0, catchAsync_1.catchAsync)(async (req, res) => {
        await notificationService_1.notificationService.markRead(req.params.id, req.user.id);
        res.json({ status: "success", data: null });
    }),
};
//# sourceMappingURL=notificationController.js.map