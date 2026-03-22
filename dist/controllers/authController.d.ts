import { Request, Response } from "express";
export declare const authController: {
    register: (req: Request, res: Response, next: import("express").NextFunction) => void;
    login: (req: Request, res: Response, next: import("express").NextFunction) => void;
    getMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    updateMe: (req: Request, res: Response, next: import("express").NextFunction) => void;
    forgotPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    resetPassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    changePassword: (req: Request, res: Response, next: import("express").NextFunction) => void;
    changeEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
};
//# sourceMappingURL=authController.d.ts.map