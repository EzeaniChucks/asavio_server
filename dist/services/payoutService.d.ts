import { User } from "../entities/User";
import { Booking } from "../entities/Booking";
interface PaystackBank {
    name: string;
    code: string;
}
export declare class PayoutService {
    private get userRepo();
    private get bookingRepo();
    getBanks(): Promise<PaystackBank[]>;
    verifyAccount(accountNumber: string, bankCode: string): Promise<{
        accountName: string;
        accountNumber: string;
    }>;
    saveHostBankDetails(hostId: string, { accountNumber, bankCode, bankName, }: {
        accountNumber: string;
        bankCode: string;
        bankName: string;
    }): Promise<User>;
    getHostBankDetails(hostId: string): Promise<{
        bankAccountNumber: string;
        bankAccountName: string;
        bankCode: string;
        bankName: string;
        hasDetails: boolean;
    }>;
    getPendingPayouts(): Promise<Booking[]>;
    processHostPayout(bookingId: string): Promise<Booking>;
}
export declare const payoutService: PayoutService;
export {};
//# sourceMappingURL=payoutService.d.ts.map