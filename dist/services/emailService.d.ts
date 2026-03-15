export interface EmailPayload {
    to: string;
    subject: string;
    html: string;
}
export declare const emailService: {
    sendWelcome(to: string, firstName: string): Promise<void>;
    sendBookingConfirmation(opts: {
        to: string;
        firstName: string;
        propertyTitle: string;
        checkIn: string;
        checkOut: string;
        nights: number;
        totalPrice: number;
        bookingId: string;
    }): Promise<void>;
    sendBookingStatusUpdate(opts: {
        to: string;
        firstName: string;
        propertyTitle: string;
        status: string;
        bookingId: string;
    }): Promise<void>;
    sendHostNewBooking(opts: {
        to: string;
        hostName: string;
        guestName: string;
        propertyTitle: string;
        checkIn: string;
        checkOut: string;
        guests: number;
        bookingId: string;
    }): Promise<void>;
    sendAdminBroadcast(opts: {
        to: string;
        subject: string;
        message: string;
    }): Promise<void>;
    sendPasswordReset(to: string, firstName: string, resetUrl: string): Promise<void>;
    sendVerificationEmail(to: string, firstName: string, verifyUrl: string): Promise<void>;
};
//# sourceMappingURL=emailService.d.ts.map