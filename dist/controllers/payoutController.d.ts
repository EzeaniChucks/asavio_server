import { Request, Response, NextFunction } from "express";
export declare const payoutController: {
    getBanks: (req: Request, res: Response, next: NextFunction) => void;
    verifyAccount: (req: Request, res: Response, next: NextFunction) => void;
    saveBankDetails: (req: Request, res: Response, next: NextFunction) => void;
    getBankDetails: (req: Request, res: Response, next: NextFunction) => void;
    getPendingPayouts: (req: Request, res: Response, next: NextFunction) => void;
    processHostPayout: (req: Request, res: Response, next: NextFunction) => void;
};
//# sourceMappingURL=payoutController.d.ts.map