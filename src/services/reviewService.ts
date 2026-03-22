// src/services/reviewService.ts
import { AppDataSource } from "../config/database";
import { Review } from "../entities/Review";
import { Property } from "../entities/Property";
import { Vehicle } from "../entities/Vehicle";
import { AppError } from "../utils/AppError";
import { notificationService } from "./notificationService";

interface CreateReviewInput {
  propertyId?: string;
  vehicleId?: string;
  rating: number;
  comment: string;
}

class ReviewService {
  private get repo() {
    return AppDataSource.getRepository(Review);
  }

  async createReview(userId: string, input: CreateReviewInput): Promise<Review> {
    const { propertyId, vehicleId, rating, comment } = input;

    if (!propertyId && !vehicleId) {
      throw new AppError("Either propertyId or vehicleId is required", 400);
    }
    if (propertyId && vehicleId) {
      throw new AppError("Provide either propertyId or vehicleId, not both", 400);
    }

    if (propertyId) {
      const property = await AppDataSource.getRepository(Property).findOne({ where: { id: propertyId } });
      if (!property) throw new AppError("Property not found", 404);

      const existing = await this.repo.findOne({ where: { propertyId, userId } });
      if (existing) throw new AppError("You have already reviewed this property", 400);
    }

    if (vehicleId) {
      const vehicle = await AppDataSource.getRepository(Vehicle).findOne({ where: { id: vehicleId } });
      if (!vehicle) throw new AppError("Vehicle not found", 404);

      const existing = await this.repo.findOne({ where: { vehicleId, userId } });
      if (existing) throw new AppError("You have already reviewed this vehicle", 400);
    }

    const review = this.repo.create({ propertyId, vehicleId, userId, rating, comment });
    const saved = await this.repo.save(review) as unknown as Review;

    if (propertyId) await this.updatePropertyRating(propertyId);
    if (vehicleId) await this.updateVehicleRating(vehicleId);

    // Notify host of new review
    if (propertyId) {
      const property = await AppDataSource.getRepository(Property).findOne({ where: { id: propertyId } });
      if (property?.hostId) {
        notificationService.send({
          userId: property.hostId,
          type: "review_received",
          title: "New review received",
          body: `A guest left a ${rating}-star review on "${property.title}".`,
          data: { url: `/properties/${propertyId}`, urlLabel: "View review" },
        }).catch(console.error);
      }
    } else if (vehicleId) {
      const vehicle = await AppDataSource.getRepository(Vehicle).findOne({ where: { id: vehicleId } });
      if (vehicle?.hostId) {
        notificationService.send({
          userId: vehicle.hostId,
          type: "review_received",
          title: "New review received",
          body: `A guest left a ${rating}-star review on your ${vehicle.make} ${vehicle.model}.`,
          data: { url: `/vehicles/${vehicleId}`, urlLabel: "View review" },
        }).catch(console.error);
      }
    }

    return saved;
  }

  async getPropertyReviews(propertyId: string): Promise<Review[]> {
    return this.repo.find({
      where: { propertyId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  async getVehicleReviews(vehicleId: string): Promise<Review[]> {
    return this.repo.find({
      where: { vehicleId },
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

    if (review.propertyId) await this.updatePropertyRating(review.propertyId);
    if (review.vehicleId) await this.updateVehicleRating(review.vehicleId);

    return saved;
  }

  async deleteReview(id: string, userId: string, role: string): Promise<void> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new AppError("Review not found", 404);
    if (role !== "admin" && review.userId !== userId) {
      throw new AppError("Not authorised to delete this review", 403);
    }

    const { propertyId, vehicleId } = review;
    await this.repo.remove(review);

    if (propertyId) await this.updatePropertyRating(propertyId);
    if (vehicleId) await this.updateVehicleRating(vehicleId);
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

  private async updateVehicleRating(vehicleId: string): Promise<void> {
    const reviews = await this.repo.find({ where: { vehicleId } });
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    await AppDataSource.getRepository(Vehicle).update(vehicleId, {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
    });
  }
}

export const reviewService = new ReviewService();
