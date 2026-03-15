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

  async getAllProperties(filters: any) {
    const queryBuilder = this.propertyRepository
      .createQueryBuilder("property")
      .leftJoinAndSelect("property.images", "images")
      .leftJoinAndSelect("property.reviews", "reviews")
      .where("property.isAvailable = :isAvailable", { isAvailable: true });

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