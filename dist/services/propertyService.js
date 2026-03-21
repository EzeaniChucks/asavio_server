"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyService = void 0;
// src/services/propertyService.ts
const database_1 = require("../config/database");
const Property_1 = require("../entities/Property");
const Image_1 = require("../entities/Image");
const Booking_1 = require("../entities/Booking");
const AppError_1 = require("../utils/AppError");
const typeorm_1 = require("typeorm");
class PropertyService {
    constructor() {
        this.propertyRepository = database_1.AppDataSource.getRepository(Property_1.Property);
        this.imageRepository = database_1.AppDataSource.getRepository(Image_1.Image);
    }
    async createProperty(propertyData, hostId, images) {
        const property = this.propertyRepository.create({
            ...propertyData,
            hostId,
            status: "pending",
            isAvailable: false, // stays hidden until approved
        });
        const savedProperty = await this.propertyRepository.save(property);
        if (images && images.length > 0) {
            const propertyImages = images.map((image) => ({
                url: image.url,
                publicId: image.publicId,
                propertyId: savedProperty.id,
            }));
            await this.imageRepository.save(propertyImages);
        }
        return this.getPropertyById(savedProperty.id);
    }
    async getPropertyById(id) {
        const property = await this.propertyRepository.findOne({
            where: { id },
            relations: ["host", "images", "reviews"],
        });
        if (!property) {
            throw new AppError_1.AppError("Property not found", 404);
        }
        return property;
    }
    // Returns all properties belonging to a specific host (regardless of status/availability)
    async getMyProperties(hostId) {
        return this.propertyRepository.find({
            where: { hostId },
            relations: ["images"],
            order: { createdAt: "DESC" },
        });
    }
    async getAllProperties(filters) {
        const queryBuilder = this.propertyRepository
            .createQueryBuilder("property")
            .leftJoinAndSelect("property.images", "images")
            .leftJoinAndSelect("property.reviews", "reviews")
            .innerJoin("property.host", "host")
            .where("property.isAvailable = :isAvailable", { isAvailable: true })
            .andWhere("property.status = :status", { status: "approved" })
            .andWhere("(host.kycStatus = 'approved' OR host.role = 'admin')");
        if (filters.city) {
            queryBuilder.andWhere("property.location->>'city' = :city", {
                city: filters.city,
            });
        }
        if (filters.minPrice) {
            queryBuilder.andWhere("property.pricePerNight >= :minPrice", {
                minPrice: filters.minPrice,
            });
        }
        if (filters.maxPrice) {
            queryBuilder.andWhere("property.pricePerNight <= :maxPrice", {
                maxPrice: filters.maxPrice,
            });
        }
        if (filters.bedrooms) {
            queryBuilder.andWhere("property.bedrooms = :bedrooms", {
                bedrooms: filters.bedrooms,
            });
        }
        if (filters.hostId) {
            queryBuilder.andWhere("property.hostId = :hostId", {
                hostId: filters.hostId,
            });
        }
        if (filters.propertyType) {
            queryBuilder.andWhere("LOWER(property.propertyType) = LOWER(:propertyType)", { propertyType: filters.propertyType });
        }
        if (filters.maxGuests) {
            queryBuilder.andWhere("property.maxGuests >= :maxGuests", {
                maxGuests: filters.maxGuests,
            });
        }
        // Date availability filter — exclude properties with a conflicting active booking
        if (filters.startDate && filters.endDate) {
            queryBuilder.andWhere(`NOT EXISTS (
          SELECT 1 FROM bookings b
          WHERE b."propertyId" = property.id
            AND b.status IN ('awaiting_payment', 'confirmed')
            AND b."checkIn" < :endDate
            AND b."checkOut" > :startDate
        )`, { startDate: filters.startDate, endDate: filters.endDate });
        }
        // Sorting
        switch (filters.sort) {
            case "price_asc":
                queryBuilder.orderBy("property.pricePerNight", "ASC");
                break;
            case "price_desc":
                queryBuilder.orderBy("property.pricePerNight", "DESC");
                break;
            case "rating":
                queryBuilder.orderBy("property.averageRating", "DESC");
                break;
            case "featured":
                // Tier → rating → review count → recency (all TypeORM-safe column refs)
                // Host tier is surfaced as a badge on the card; rating+reviews+freshness drive order
                queryBuilder
                    .orderBy("property.averageRating", "DESC")
                    .addOrderBy("property.totalReviews", "DESC")
                    .addOrderBy("property.createdAt", "DESC");
                break;
            case "popular":
                queryBuilder
                    .orderBy("property.totalReviews", "DESC")
                    .addOrderBy("property.averageRating", "DESC");
                break;
            default:
                queryBuilder.orderBy("property.createdAt", "DESC");
        }
        if (filters.limit) {
            queryBuilder.take(Number(filters.limit));
        }
        return queryBuilder.getMany();
    }
    /**
     * Returns three curated slices for the home page discovery sections.
     *
     * topPicks and popular use native SQL to sort by expressions TypeORM can't
     * express in orderBy() without alias-resolution issues. IDs are fetched via
     * raw query, then full entities are loaded and re-sorted to preserve order.
     */
    async getHomeSections() {
        const BASE_WHERE = `
      property."isAvailable" = true
      AND property.status = 'approved'
      AND (host."kycStatus" = 'approved' OR host.role = 'admin')
    `;
        const BASE_FROM = `
      FROM properties property
      INNER JOIN users host ON host.id = property."hostId"
      WHERE ${BASE_WHERE}
    `;
        const [topPickRows, newlyListed, popularRows] = await Promise.all([
            // Top Picks — weighted ranking: host tier + rating + log(reviews) + freshness
            database_1.AppDataSource.query(`
        SELECT property.id
        ${BASE_FROM}
        ORDER BY (
          CASE host."hostTier"
            WHEN 'top_host' THEN 30
            WHEN 'trusted_host' THEN 15
            ELSE 0
          END
          + property."averageRating" * 8
          + LEAST(LOG(1.0 + CAST(property."totalReviews" AS FLOAT)) * 6, 20)
          + CASE WHEN property."createdAt" > NOW() - INTERVAL '30 days' THEN 8 ELSE 0 END
        ) DESC
        LIMIT 6
      `),
            // Newly Listed — TypeORM handles this just fine
            this.propertyRepository
                .createQueryBuilder("property")
                .leftJoinAndSelect("property.images", "images")
                .innerJoinAndSelect("property.host", "host")
                .where("property.isAvailable = true")
                .andWhere("property.status = :status", { status: "approved" })
                .andWhere("(host.kycStatus = 'approved' OR host.role = 'admin')")
                .orderBy("property.createdAt", "DESC")
                .take(6)
                .getMany(),
            // Most Popular — sort by confirmed booking count
            database_1.AppDataSource.query(`
        SELECT property.id,
          (SELECT COUNT(*) FROM bookings b2
           WHERE b2."propertyId" = property.id
             AND b2.status IN ('confirmed', 'completed')) AS booking_count
        ${BASE_FROM}
        ORDER BY booking_count DESC, property."averageRating" DESC
        LIMIT 6
      `),
        ]);
        // Load full entities for the natively-ranked sections, preserving sort order
        const loadOrdered = async (rows) => {
            if (!rows.length)
                return [];
            const ids = rows.map((r) => r.id);
            const props = await this.propertyRepository.find({
                where: { id: (0, typeorm_1.In)(ids) },
                relations: ["images", "host"],
            });
            return ids.map((id) => props.find((p) => p.id === id)).filter(Boolean);
        };
        const [topPicks, popular] = await Promise.all([
            loadOrdered(topPickRows),
            loadOrdered(popularRows),
        ]);
        return { topPicks, newlyListed, popular };
    }
    // Returns distinct property types that have at least one approved+available listing
    async getAvailablePropertyTypes() {
        const rows = await this.propertyRepository
            .createQueryBuilder("property")
            .select("DISTINCT property.propertyType", "type")
            .where("property.isAvailable = :isAvailable", { isAvailable: true })
            .andWhere("property.status = :status", { status: "approved" })
            .orderBy("property.propertyType", "ASC")
            .getRawMany();
        return rows.map((r) => r.type);
    }
    async updateProperty(id, updateData, hostId) {
        const property = await this.getPropertyById(id);
        if (property.hostId !== hostId) {
            throw new AppError_1.AppError("You can only update your own properties", 403);
        }
        await this.propertyRepository.update(id, updateData);
        return this.getPropertyById(id);
    }
    async deleteProperty(id, hostId) {
        const property = await this.getPropertyById(id);
        if (property.hostId !== hostId) {
            throw new AppError_1.AppError("You can only delete your own properties", 403);
        }
        await this.propertyRepository.delete(id);
    }
    /**
     * Returns all booked date ranges (confirmed/awaiting_payment) PLUS host-blocked
     * date ranges for a given property, combined into a single list the frontend uses
     * to disable unavailable days on the calendar.
     */
    async getBookedDates(propertyId) {
        const bookingRepo = database_1.AppDataSource.getRepository(Booking_1.Booking);
        const [bookings, property] = await Promise.all([
            bookingRepo.find({
                where: { propertyId, status: (0, typeorm_1.In)(["awaiting_payment", "confirmed"]) },
                select: ["checkIn", "checkOut"],
            }),
            this.propertyRepository.findOne({ where: { id: propertyId }, select: ["blockedDates"] }),
        ]);
        const booked = bookings.map((b) => ({
            checkIn: String(b.checkIn).split("T")[0],
            checkOut: String(b.checkOut).split("T")[0],
        }));
        const blocked = (property?.blockedDates ?? []).map((r) => ({
            checkIn: r.from,
            checkOut: r.to,
        }));
        return [...booked, ...blocked];
    }
    /** Host: replace the full blockedDates array for a property */
    async updateBlockedDates(propertyId, hostId, blockedDates) {
        const property = await this.propertyRepository.findOne({ where: { id: propertyId } });
        if (!property)
            throw new AppError_1.AppError("Property not found", 404);
        if (property.hostId !== hostId)
            throw new AppError_1.AppError("Not your property", 403);
        await this.propertyRepository.update(propertyId, { blockedDates });
    }
}
exports.PropertyService = PropertyService;
//# sourceMappingURL=propertyService.js.map