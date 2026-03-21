import { Request, Response } from "express";
export declare const notificationController: {
    /** GET /notifications */
    list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /notifications/unread-count */
    unreadCount: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** PATCH /notifications/read-all */
    markAllRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** PATCH /notifications/:id/read */
    markRead: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=notificationController.d.ts.map