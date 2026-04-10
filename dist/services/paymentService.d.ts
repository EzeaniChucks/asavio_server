import { Booking } from "../entities/Booking";
export declare class PaymentService {
    private get bookingRepo();
    initializePayment(bookingId: string, userId: string): Promise<{
        authorization_url: string;
        reference: string;
    }>;
    verifyPayment(reference: string): Promise<Booking>;
    /**
     * Issues a Paystack refund for the given reference.
     * @param paystackReference  The original transaction reference stored on the booking
     * @param amountNGN          Amount to refund in NGN (converted to kobo internally). Omit for full refund.
     */
    refundTransaction(paystackReference: string, amountNGN: number): Promise<void>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<void>;
}
export declare const paymentService: PaymentService;
//# sourceMappingURL=paymentService.d.ts.map