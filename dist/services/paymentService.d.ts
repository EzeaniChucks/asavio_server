import { Booking } from "../entities/Booking";
export declare class PaymentService {
    private get bookingRepo();
    initializePayment(bookingId: string, userId: string): Promise<{
        authorization_url: string;
        reference: string;
    }>;
    verifyPayment(reference: string): Promise<Booking>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=paymentService.d.ts.map