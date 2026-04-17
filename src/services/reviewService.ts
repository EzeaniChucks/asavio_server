// src/services/reviewService.ts
import { AppDataSource } from "../config/database";
import { Review } from "../entities/Review";
import { Property } from "../entities/Property";
import { Vehicle } from "../entities/Vehicle";
import { Hotel } from "../entities/Hotel";
import { EventCenter } from "../entities/EventCenter";
import { EventBooking } from "../entities/EventBooking";
import { Booking } from "../entities/Booking";
import { AppError } from "../utils/AppError";
import { notificationService } from "./notificationService";

interface CreateReviewInput {
  propertyId?: string;
  vehicleId?: string;
  hotelId?: string;
  eventCenterId?: string;
  rating: number;
  comment: string;
}

class ReviewService {
  private get repo() {
    return AppDataSource.getRepository(Review);
  }

  async createReview(userId: string, input: CreateReviewInput): Promise<Review> {
    const { propertyId, vehicleId, hotelId, eventCenterId, rating, comment } = input;

    const provided = [propertyId, vehicleId, hotelId, eventCenterId].filter(Boolean).length;
    if (provided === 0) {
      throw new AppError("Either propertyId, vehicleId, hotelId, or eventCenterId is required", 400);
    }
    if (provided > 1) {
      throw new AppError("Provide only one of propertyId, vehicleId, hotelId, or eventCenterId", 400);
    }

    if (propertyId) {
      const property = await AppDataSource.getRepository(Property).findOne({ where: { id: propertyId } });
      if (!property) throw new AppError("Property not found", 404);

      // Must have a completed booking for this property
      const completedBooking = await AppDataSource.getRepository(Booking).findOne({
        where: { userId, propertyId, status: "completed" },
      });
      if (!completedBooking) {
        throw new AppError("You can only review a property after completing a stay", 403);
      }

      const existing = await this.repo.findOne({ where: { propertyId, userId } });
      if (existing) throw new AppError("You have already reviewed this property", 400);
    }

    if (vehicleId) {
      const vehicle = await AppDataSource.getRepository(Vehicle).findOne({ where: { id: vehicleId } });
      if (!vehicle) throw new AppError("Vehicle not found", 404);

      // Must have a completed booking for this vehicle
      const completedBooking = await AppDataSource.getRepository(Booking).findOne({
        where: { userId, vehicleId, status: "completed" },
      });
      if (!completedBooking) {
        throw new AppError("You can only review a vehicle after completing a rental", 403);
      }

      const existing = await this.repo.findOne({ where: { vehicleId, userId } });
      if (existing) throw new AppError("You have already reviewed this vehicle", 400);
    }

    if (hotelId) {
      const hotel = await AppDataSource.getRepository(Hotel).findOne({ where: { id: hotelId } });
      if (!hotel) throw new AppError("Hotel not found", 404);

      // Must have a completed booking for this hotel
      const completedBooking = await AppDataSource.getRepository(Booking).findOne({
        where: { userId, hotelId, status: "completed" },
      });
      if (!completedBooking) {
        throw new AppError("You can only review a hotel after completing a stay", 403);
      }

      const existing = await this.repo.findOne({ where: { hotelId, userId } });
      if (existing) throw new AppError("You have already reviewed this hotel", 400);
    }

    if (eventCenterId) {
      const ec = await AppDataSource.getRepository(EventCenter).findOne({ where: { id: eventCenterId } });
      if (!ec) throw new AppError("Event center not found", 404);

      const completedBooking = await AppDataSource.getRepository(EventBooking).findOne({
        where: { userId, eventCenterId, status: "completed" },
      });
      if (!completedBooking) {
        throw new AppError("You can only review an event center after completing an event booking", 403);
      }

      const existing = await this.repo.findOne({ where: { eventCenterId, userId } });
      if (existing) throw new AppError("You have already reviewed this event center", 400);
    }

    const review = this.repo.create({ propertyId, vehicleId, hotelId, eventCenterId, userId, rating, comment });
    const saved = await this.repo.save(review) as unknown as Review;

    if (propertyId) await this.updatePropertyRating(propertyId);
    if (vehicleId) await this.updateVehicleRating(vehicleId);
    if (hotelId) await this.updateHotelRating(hotelId);
    if (eventCenterId) await this.updateEventCenterRating(eventCenterId);

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
    } else if (hotelId) {
      const hotel = await AppDataSource.getRepository(Hotel).findOne({ where: { id: hotelId } });
      if (hotel?.hostId) {
        notificationService.send({
          userId: hotel.hostId,
          type: "review_received",
          title: "New review received",
          body: `A guest left a ${rating}-star review on "${hotel.name}".`,
          data: { url: `/hotels/${hotelId}`, urlLabel: "View review" },
        }).catch(console.error);
      }
    } else if (eventCenterId) {
      const ec = await AppDataSource.getRepository(EventCenter).findOne({ where: { id: eventCenterId } });
      if (ec?.hostId) {
        notificationService.send({
          userId: ec.hostId,
          type: "review_received",
          title: "New review received",
          body: `A guest left a ${rating}-star review on "${ec.name}".`,
          data: { url: `/events/${eventCenterId}`, urlLabel: "View review" },
        }).catch(console.error);
      }
    }

    return saved;
  }

  async getEventCenterReviews(eventCenterId: string): Promise<Review[]> {
    return this.repo.find({
      where: { eventCenterId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  async getHotelReviews(hotelId: string): Promise<Review[]> {
    return this.repo.find({
      where: { hotelId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
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
    if (review.hotelId) await this.updateHotelRating(review.hotelId);
    if (review.eventCenterId) await this.updateEventCenterRating(review.eventCenterId);

    return saved;
  }

  async deleteReview(id: string, userId: string, role: string): Promise<void> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new AppError("Review not found", 404);
    if (role !== "admin" && review.userId !== userId) {
      throw new AppError("Not authorised to delete this review", 403);
    }

    const { propertyId, vehicleId, hotelId, eventCenterId } = review;
    await this.repo.remove(review);

    if (propertyId) await this.updatePropertyRating(propertyId);
    if (vehicleId) await this.updateVehicleRating(vehicleId);
    if (hotelId) await this.updateHotelRating(hotelId);
    if (eventCenterId) await this.updateEventCenterRating(eventCenterId);
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

  private async updateHotelRating(hotelId: string): Promise<void> {
    const reviews = await this.repo.find({ where: { hotelId } });
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    await AppDataSource.getRepository(Hotel).update(hotelId, {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
    });
  }

  private async updateEventCenterRating(eventCenterId: string): Promise<void> {
    const reviews = await this.repo.find({ where: { eventCenterId } });
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
    await AppDataSource.getRepository(EventCenter).update(eventCenterId, {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
    });
  }
}

export const reviewService = new ReviewService();
