import { Review } from "../entities/Review";
interface CreateReviewInput {
    propertyId?: string;
    vehicleId?: string;
    hotelId?: string;
    eventCenterId?: string;
    rating: number;
    comment: string;
}
declare class ReviewService {
    private get repo();
    createReview(userId: string, input: CreateReviewInput): Promise<Review>;
    getEventCenterReviews(eventCenterId: string): Promise<Review[]>;
    getHotelReviews(hotelId: string): Promise<Review[]>;
    getPropertyReviews(propertyId: string): Promise<Review[]>;
    getVehicleReviews(vehicleId: string): Promise<Review[]>;
    getAllReviews(page?: number, limit?: number): Promise<{
        reviews: Review[];
        total: number;
    }>;
    updateReview(id: string, userId: string, role: string, updates: Partial<CreateReviewInput>): Promise<Review>;
    deleteReview(id: string, userId: string, role: string): Promise<void>;
    private updatePropertyRating;
    private updateVehicleRating;
    private updateHotelRating;
    private updateEventCenterRating;
}
export declare const reviewService: ReviewService;
export {};
//# sourceMappingURL=reviewService.d.ts.map