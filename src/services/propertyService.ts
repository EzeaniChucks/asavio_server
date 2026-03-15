// src/services/propertyService.ts
import { AppDataSource } from "../config/database";
import { Property } from "../entities/Property";
import { Image } from "../entities/Image";
import { AppError } from "../utils/AppError";

export class PropertyService {
  private propertyRepository = AppDataSource.getRepository(Property);
  private imageRepository = AppDataSource.getRepository(Image);

  async createProperty(propertyData: any, hostId: string, images?: any[]) {
    const property = this.propertyRepository.create({
      ...propertyData,
      hostId,
      status: "pending",
      isAvailable: false, // stays hidden until approved
    });

    const savedProperty = await this.propertyRepository.save(property) as unknown as Property;

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

  async getPropertyById(id: string) {
    const property = await this.propertyRepository.findOne({
      where: { id },
      relations: ["host", "images", "reviews"],
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    return property;
  }

  // Returns all properties belonging to a specific host (regardless of status/availability)
  async getMyProperties(hostId: string) {
    return this.propertyRepository.find({
      where: { hostId },
      relations: ["images"],
      order: { createdAt: "DESC" },
    });
  }

  async getAllProperties(filters: any) {
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.images", "images")
      .leftJoinAndSelect("property.reviews", "reviews")
      .where("property.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("property.status = :status", { status: "approved" });

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
      queryBuilder.andWhere(
        "LOWER(property.propertyType) = LOWER(:propertyType)",
        { propertyType: filters.propertyType }
      );
    }

    if (filters.maxGuests) {
      queryBuilder.andWhere("property.maxGuests >= :maxGuests", {
        maxGuests: filters.maxGuests,
      });
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
      default:
        queryBuilder.orderBy("property.createdAt", "DESC");
    }

    return queryBuilder.getMany();
  }

  // Returns distinct property types that have at least one approved+available listing
  async getAvailablePropertyTypes(): Promise<string[]> {
    const rows = await this.propertyRepository
      .createQueryBuilder("property")
      .select("DISTINCT property.propertyType", "type")
      .where("property.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("property.status = :status", { status: "approved" })
      .orderBy("property.propertyType", "ASC")
      .getRawMany();
    return rows.map((r) => r.type as string);
  }

  async updateProperty(id: string, updateData: any, hostId: string) {
    const property = await this.getPropertyById(id);

    if (property.hostId !== hostId) {
      throw new AppError("You can only update your own properties", 403);
    }

    await this.propertyRepository.update(id, updateData);
    return this.getPropertyById(id);
  }

  async deleteProperty(id: string, hostId: string) {
    const property = await this.getPropertyById(id);

    if (property.hostId !== hostId) {
      throw new AppError("You can only delete your own properties", 403);
    }

    await this.propertyRepository.delete(id);
  }
}
