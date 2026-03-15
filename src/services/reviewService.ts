// src/services/reviewService.ts
import { AppDataSource } from "../config/database";
import { Review } from "../entities/Review";
import { Property } from "../entities/Property";
import { Booking } from "../entities/Booking";
import { AppError } from "../utils/AppError";

interface CreateReviewInput {
  propertyId: string;
  rating: number;
  comment: string;
}

class ReviewService {
  private get repo() {
    return AppDataSource.getRepository(Review);
  }

  async createReview(userId: string, input: CreateReviewInput): Promise<Review> {
    // Verify property exists
    const property = await AppDataSource.getRepository(Property).findOne({
      where: { id: input.propertyId },
    });
    if (!property) throw new AppError("Property not found", 404);

    // Verify user has a completed booking for this property
    const booking = await AppDataSource.getRepository(Booking).findOne({
      where: { propertyId: input.propertyId, userId, status: "completed" },
    });
    if (!booking) {
      throw new AppError("You can only review properties you have stayed at", 403);
    }

    // Prevent duplicate review
    const existing = await this.repo.findOne({
      where: { propertyId: input.propertyId, userId },
    });
    if (existing) throw new AppError("You have already reviewed this property", 400);

    const review = this.repo.create({ ...input, userId });
    const saved = await this.repo.save(review) as unknown as Review;

    // Update property average rating
    await this.updatePropertyRating(input.propertyId);

    return saved;
  }

  async getPropertyReviews(propertyId: string): Promise<Review[]> {
    return this.repo.find({
      where: { propertyId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  async getAllReviews(page = 1, limit = 20): Promise<{ reviews: Review[]; total: number }> {
    const [reviews, total] = await this.repo.findAndCount({
      relations: ["user", "property"],
      order: { createdAt: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { reviews, total };
  }

  async updateReview(
    id: string,
    userId: string,
    role: string,
    updates: Partial<CreateReviewInput>
  ): Promise<Review> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new AppError("Review not found", 404);
    if (role !== "admin" && review.userId !== userId) {
      throw new AppError("Not authorised to edit this review", 403);
    }

    Object.assign(review, updates);
    const saved = await this.repo.save(review) as unknown as Review;
    await this.updatePropertyRating(review.propertyId);
    return saved;
  }

  async deleteReview(id: string, userId: string, role: string): Promise<void> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new AppError("Review not found", 404);
    if (role !== "admin" && review.userId !== userId) {
      throw new AppError("Not authorised to delete this review", 403);
    }
    const propertyId = review.propertyId;
    await this.repo.remove(review);
    await this.updatePropertyRating(propertyId);
  }

  private async updatePropertyRating(propertyId: string): Promise<void> {
    const reviews = await this.repo.find({ where: { propertyId } });
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;

    await AppDataSource.getRepository(Property).update(propertyId, {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
    });
  }
}

export const reviewService = new ReviewService();
