import { Request, Response, NextFunction } from "express";
export declare const protect: (req: Request, res: Response, next: NextFunction) => void;
export declare const restrictTo: (...roles: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * Checks that the logged-in admin has ALL of the specified permissions.
 * Super-admins (isSuperAdmin = true OR adminPermissions = null) bypass all checks.
 */
export declare const hasPermission: (...permissions: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map