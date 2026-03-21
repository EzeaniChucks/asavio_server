import { Request, Response } from "express";
export declare const conversationController: {
    /** GET /conversations */
    list: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** POST /conversations — start or retrieve an existing conversation */
    getOrCreate: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /conversations/:id/messages */
    messages: (req: Request, res: Response, next: import("express").NextFunction) => void;
    /** GET /conversations/unread-count */
    unreadCount: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=conversationController.d.ts.map