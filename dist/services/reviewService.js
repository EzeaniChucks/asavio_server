"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = void 0;
// src/services/reviewService.ts
const database_1 = require("../config/database");
const Review_1 = require("../entities/Review");
const Property_1 = require("../entities/Property");
const Vehicle_1 = require("../entities/Vehicle");
const Hotel_1 = require("../entities/Hotel");
const EventCenter_1 = require("../entities/EventCenter");
const EventBooking_1 = require("../entities/EventBooking");
const Booking_1 = require("../entities/Booking");
const AppError_1 = require("../utils/AppError");
const notificationService_1 = require("./notificationService");
class ReviewService {
    get repo() {
        return database_1.AppDataSource.getRepository(Review_1.Review);
    }
    async createReview(userId, input) {
        const { propertyId, vehicleId, hotelId, eventCenterId, rating, comment } = input;
        const provided = [propertyId, vehicleId, hotelId, eventCenterId].filter(Boolean).length;
        if (provided === 0) {
            throw new AppError_1.AppError("Either propertyId, vehicleId, hotelId, or eventCenterId is required", 400);
        }
        if (provided > 1) {
            throw new AppError_1.AppError("Provide only one of propertyId, vehicleId, hotelId, or eventCenterId", 400);
        }
        if (propertyId) {
            const property = await database_1.AppDataSource.getRepository(Property_1.Property).findOne({ where: { id: propertyId } });
            if (!property)
                throw new AppError_1.AppError("Property not found", 404);
            // Must have a completed booking for this property
            const completedBooking = await database_1.AppDataSource.getRepository(Booking_1.Booking).findOne({
                where: { userId, propertyId, status: "completed" },
            });
            if (!completedBooking) {
                throw new AppError_1.AppError("You can only review a property after completing a stay", 403);
            }
            const existing = await this.repo.findOne({ where: { propertyId, userId } });
            if (existing)
                throw new AppError_1.AppError("You have already reviewed this property", 400);
        }
        if (vehicleId) {
            const vehicle = await database_1.AppDataSource.getRepository(Vehicle_1.Vehicle).findOne({ where: { id: vehicleId } });
            if (!vehicle)
                throw new AppError_1.AppError("Vehicle not found", 404);
            // Must have a completed booking for this vehicle
            const completedBooking = await database_1.AppDataSource.getRepository(Booking_1.Booking).findOne({
                where: { userId, vehicleId, status: "completed" },
            });
            if (!completedBooking) {
                throw new AppError_1.AppError("You can only review a vehicle after completing a rental", 403);
            }
            const existing = await this.repo.findOne({ where: { vehicleId, userId } });
            if (existing)
                throw new AppError_1.AppError("You have already reviewed this vehicle", 400);
        }
        if (hotelId) {
            const hotel = await database_1.AppDataSource.getRepository(Hotel_1.Hotel).findOne({ where: { id: hotelId } });
            if (!hotel)
                throw new AppError_1.AppError("Hotel not found", 404);
            // Must have a completed booking for this hotel
            const completedBooking = await database_1.AppDataSource.getRepository(Booking_1.Booking).findOne({
                where: { userId, hotelId, status: "completed" },
            });
            if (!completedBooking) {
                throw new AppError_1.AppError("You can only review a hotel after completing a stay", 403);
            }
            const existing = await this.repo.findOne({ where: { hotelId, userId } });
            if (existing)
                throw new AppError_1.AppError("You have already reviewed this hotel", 400);
        }
        if (eventCenterId) {
            const ec = await database_1.AppDataSource.getRepository(EventCenter_1.EventCenter).findOne({ where: { id: eventCenterId } });
            if (!ec)
                throw new AppError_1.AppError("Event center not found", 404);
            const completedBooking = await database_1.AppDataSource.getRepository(EventBooking_1.EventBooking).findOne({
                where: { userId, eventCenterId, status: "completed" },
            });
            if (!completedBooking) {
                throw new AppError_1.AppError("You can only review an event center after completing an event booking", 403);
            }
            const existing = await this.repo.findOne({ where: { eventCenterId, userId } });
            if (existing)
                throw new AppError_1.AppError("You have already reviewed this event center", 400);
        }
        const review = this.repo.create({ propertyId, vehicleId, hotelId, eventCenterId, userId, rating, comment });
        const saved = await this.repo.save(review);
        if (propertyId)
            await this.updatePropertyRating(propertyId);
        if (vehicleId)
            await this.updateVehicleRating(vehicleId);
        if (hotelId)
            await this.updateHotelRating(hotelId);
        if (eventCenterId)
            await this.updateEventCenterRating(eventCenterId);
        // Notify host of new review
        if (propertyId) {
            const property = await database_1.AppDataSource.getRepository(Property_1.Property).findOne({ where: { id: propertyId } });
            if (property?.hostId) {
                notificationService_1.notificationService.send({
                    userId: property.hostId,
                    type: "review_received",
                    title: "New review received",
                    body: `A guest left a ${rating}-star review on "${property.title}".`,
                    data: { url: `/properties/${propertyId}`, urlLabel: "View review" },
                }).catch(console.error);
            }
        }
        else if (vehicleId) {
            const vehicle = await database_1.AppDataSource.getRepository(Vehicle_1.Vehicle).findOne({ where: { id: vehicleId } });
            if (vehicle?.hostId) {
                notificationService_1.notificationService.send({
                    userId: vehicle.hostId,
                    type: "review_received",
                    title: "New review received",
                    body: `A guest left a ${rating}-star review on your ${vehicle.make} ${vehicle.model}.`,
                    data: { url: `/vehicles/${vehicleId}`, urlLabel: "View review" },
                }).catch(console.error);
            }
        }
        else if (hotelId) {
            const hotel = await database_1.AppDataSource.getRepository(Hotel_1.Hotel).findOne({ where: { id: hotelId } });
            if (hotel?.hostId) {
                notificationService_1.notificationService.send({
                    userId: hotel.hostId,
                    type: "review_received",
                    title: "New review received",
                    body: `A guest left a ${rating}-star review on "${hotel.name}".`,
                    data: { url: `/hotels/${hotelId}`, urlLabel: "View review" },
                }).catch(console.error);
            }
        }
        else if (eventCenterId) {
            const ec = await database_1.AppDataSource.getRepository(EventCenter_1.EventCenter).findOne({ where: { id: eventCenterId } });
            if (ec?.hostId) {
                notificationService_1.notificationService.send({
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
    async getEventCenterReviews(eventCenterId) {
        return this.repo.find({
            where: { eventCenterId },
            relations: ["user"],
            order: { createdAt: "DESC" },
        });
    }
    async getHotelReviews(hotelId) {
        return this.repo.find({
            where: { hotelId },
            relations: ["user"],
            order: { createdAt: "DESC" },
        });
    }
    async getPropertyReviews(propertyId) {
        return this.repo.find({
            where: { propertyId },
            relations: ["user"],
            order: { createdAt: "DESC" },
        });
    }
    async getVehicleReviews(vehicleId) {
        return this.repo.find({
            where: { vehicleId },
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
        if (review.propertyId)
            await this.updatePropertyRating(review.propertyId);
        if (review.vehicleId)
            await this.updateVehicleRating(review.vehicleId);
        if (review.hotelId)
            await this.updateHotelRating(review.hotelId);
        if (review.eventCenterId)
            await this.updateEventCenterRating(review.eventCenterId);
        return saved;
    }
    async deleteReview(id, userId, role) {
        const review = await this.repo.findOne({ where: { id } });
        if (!review)
            throw new AppError_1.AppError("Review not found", 404);
        if (role !== "admin" && review.userId !== userId) {
            throw new AppError_1.AppError("Not authorised to delete this review", 403);
        }
        const { propertyId, vehicleId, hotelId, eventCenterId } = review;
        await this.repo.remove(review);
        if (propertyId)
            await this.updatePropertyRating(propertyId);
        if (vehicleId)
            await this.updateVehicleRating(vehicleId);
        if (hotelId)
            await this.updateHotelRating(hotelId);
        if (eventCenterId)
            await this.updateEventCenterRating(eventCenterId);
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
    async updateVehicleRating(vehicleId) {
        const reviews = await this.repo.find({ where: { vehicleId } });
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
        await database_1.AppDataSource.getRepository(Vehicle_1.Vehicle).update(vehicleId, {
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: total,
        });
    }
    async updateHotelRating(hotelId) {
        const reviews = await this.repo.find({ where: { hotelId } });
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
        await database_1.AppDataSource.getRepository(Hotel_1.Hotel).update(hotelId, {
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: total,
        });
    }
    async updateEventCenterRating(eventCenterId) {
        const reviews = await this.repo.find({ where: { eventCenterId } });
        const total = reviews.length;
        const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
        await database_1.AppDataSource.getRepository(EventCenter_1.EventCenter).update(eventCenterId, {
            averageRating: Math.round(avg * 10) / 10,
            totalReviews: total,
        });
    }
}
exports.reviewService = new ReviewService();
//# sourceMappingURL=reviewService.js.map