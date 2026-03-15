import { Request, Response, NextFunction } from "express";
import { ValidationChain } from "express-validator";
export declare const validate: (validations: ValidationChain[]) => (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validation.d.ts.map