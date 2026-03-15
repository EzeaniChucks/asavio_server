"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = void 0;
// src/services/reviewService.ts
const database_1 = require("../config/database");
const Review_1 = require("../entities/Review");
const Property_1 = require("../entities/Property");
const Booking_1 = require("../entities/Booking");
const AppError_1 = require("../utils/AppError");
class ReviewService {
    get repo() {
        return database_1.AppDataSource.getRepository(Review_1.Review);
    }
    async createReview(userId, input) {
        // Verify property exists
        const property = await database_1.AppDataSource.getRepository(Property_1.Property).findOne({
            where: { id: input.propertyId },
        });
        if (!property)
            throw new AppError_1.AppError("Property not found", 404);
        // Verify user has a completed booking for this property
        const booking = await database_1.AppDataSource.getRepository(Booking_1.Booking).findOne({
            where: { propertyId: input.propertyId, userId, status: "completed" },
        });
        if (!booking) {
            throw new AppError_1.AppError("You can only review properties you have stayed at", 403);
        }
        // Prevent duplicate review
        const existing = await this.repo.findOne({
            where: { propertyId: input.propertyId, userId },
        });
        if (existing)
            throw new AppError_1.AppError("You have already reviewed this property", 400);
        const review = this.repo.create({ ...input, userId });
        const saved = await this.repo.save(review);
        // Update property average rating
        await this.updatePropertyRating(input.propertyId);
        return saved;
    }
    async getPropertyReviews(propertyId) {
        return this.repo.find({
            where: { propertyId },
            relations: ["user"],
            order: { createdAt: "DESC" },
        });
    }
    async getAllReviews(page = 1, limit = 20) {
        const [reviews, total] = await this.repo.findAndCount({
            relations: ["user", "property"],
            order: { createdAt: "DESC" },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { reviews, total };
    }
    async updateReview(id, userId, role, updates) {
        const review = await this.repo.findOne({ where: { id } });
        if (!review)
            throw new AppError_1.AppError("Review not found", 404);
        if (role !== "admin" && review.userId !== userId) {
            throw new AppError_1.AppError("Not authorised to edit this review", 403);
        }
        Object.assign(review, updates);
        const saved = await this.repo.save(review);
        await this.updatePropertyRating(review.propertyId);
        return saved;
    }
    async deleteReview(id, userId, role) {
        const review = await this.repo.findOne({ where: { id } });
        if (!review)
            throw new AppError_1.AppError("Review not found", 404);
        if (role !== "admin" && review.userId !== userId) {
            throw new AppError_1.AppError("Not authorised to delete this review", 403);
        }
        const propertyId = review.propertyId;
        await this.repo.remove(review);
        await this.updatePropertyRating(propertyId);
    }
    async updatePropertyRating(propertyId) {
        const reviews = await this.repo.find({ where: { propertyId } });
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
        await database_1.AppDataSource.getRepository(Property_1.Property).update(propertyId, {
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: total,
        });
    }
}
exports.reviewService = new ReviewService();
//# sourceMappingURL=reviewService.js.map