import { Review } from "../entities/Review";
interface CreateReviewInput {
    propertyId: string;
    rating: number;
    comment: string;
}
declare class ReviewService {
    private get repo();
    createReview(userId: string, input: CreateReviewInput): Promise<Review>;
    getPropertyReviews(propertyId: string): Promise<Review[]>;
    getAllReviews(page?: number, limit?: number): Promise<{
        reviews: Review[];
        total: number;
    }>;
    updateReview(id: string, userId: string, role: string, updates: Partial<CreateReviewInput>): Promise<Review>;
    deleteReview(id: string, userId: string, role: string): Promise<void>;
    private updatePropertyRating;
}
export declare const reviewService: ReviewService;
export {};
//# sourceMappingURL=reviewService.d.ts.map