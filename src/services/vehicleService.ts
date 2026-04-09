// src/services/vehicleService.ts
import { AppDataSource } from "../config/database";
import { Vehicle } from "../entities/Vehicle";
import { AppError } from "../utils/AppError";
import { CloudinaryService } from "./cloudinaryService";
import { In } from "typeorm";

const cloudinaryService = new CloudinaryService();

interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  pricePerDay: number;
  priceWithDriverPerDay?: number | null;
  cautionFee?: number | string | null;
  description: string;
  seats: number;
  withDriver?: boolean;
  location?: string;
  features?: string[];
}

interface VehicleFilters {
  vehicleType?: string;
  minPrice?: number;
  maxPrice?: number;
  withDriver?: boolean;
  location?: string;
  seats?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

class VehicleService {
  private get repo() {
    return AppDataSource.getRepository(Vehicle);
  }

  async createVehicle(
    hostId: string,
    input: CreateVehicleInput,
    files: Express.Multer.File[]
  ): Promise<Vehicle> {
    const uploadedImages: { url: string; publicId: string }[] = [];
    for (const file of files) {
      const result = await cloudinaryService.uploadImage(file, "vehicles");
      uploadedImages.push(result);
    }

    const vehicle = this.repo.create({
      ...input,
      year: Number(input.year),
      pricePerDay: Number(input.pricePerDay),
      priceWithDriverPerDay: input.priceWithDriverPerDay != null ? Number(input.priceWithDriverPerDay) : null,
      cautionFee: input.cautionFee === "" || input.cautionFee == null ? null : Number(input.cautionFee),
      seats: Number(input.seats),
      withDriver: input.withDriver ?? false,
      status: "pending" as any,
      isAvailable: false,
      features: input.features ?? [],
      images: uploadedImages,
      hostId,
    });

    return this.repo.save(vehicle) as unknown as Vehicle;
  }

  async getAvailableVehicleTypes(): Promise<string[]> {
    const rows = await AppDataSource.getRepository(Vehicle)
      .createQueryBuilder("vehicle")
      .select("DISTINCT vehicle.vehicleType", "type")
      .where("vehicle.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("vehicle.status = :status", { status: "approved" })
      .orderBy("vehicle.vehicleType", "ASC")
      .getRawMany();
    return rows.map((r) => r.type as string);
  }

  // Returns one representative vehicle (best-rated) per available type
  async getVehicleTypeRepresentatives(): Promise<Vehicle[]> {
    const rows = await AppDataSource.query<{ id: string }[]>(`
      SELECT DISTINCT ON (LOWER(v."vehicleType")) v.id
      FROM vehicles v
      INNER JOIN users host ON host.id = v."hostId"
      WHERE v."isAvailable" = true AND v."status" = 'approved'
        AND host."kycStatus" = 'approved'
      ORDER BY LOWER(v."vehicleType"), v."averageRating" DESC, v."createdAt" DESC
    `);

    if (!rows.length) return [];

    const ids = rows.map((r) => r.id);
    const vehicles = await this.repo.find({
      where: { id: In(ids) },
      relations: ["host"],
    });

    // Preserve DISTINCT ON ordering
    return ids.map((id) => vehicles.find((v) => v.id === id)!).filter(Boolean);
  }

  async getVehicles(filters: VehicleFilters = {}): Promise<{ vehicles: Vehicle[]; total: number }> {
    const {
      vehicleType,
      minPrice,
      maxPrice,
      withDriver,
      location,
      seats,
      sort = "newest",
      page = 1,
      limit = 12,
    } = filters;

    const qb = this.repo
      .createQueryBuilder("v")
      .innerJoinAndSelect("v.host", "host")
      .where("v.isAvailable = :avail", { avail: true })
      .andWhere("v.status = :vstatus", { vstatus: "approved" })
      .andWhere("host.kycStatus = :kycStatus", { kycStatus: "approved" });

    if (vehicleType) qb.andWhere("v.vehicleType = :vehicleType", { vehicleType });
    if (minPrice !== undefined) qb.andWhere("v.pricePerDay >= :minPrice", { minPrice });
    if (maxPrice !== undefined) qb.andWhere("v.pricePerDay <= :maxPrice", { maxPrice });
    if (withDriver !== undefined) qb.andWhere("v.withDriver = :withDriver", { withDriver });
    if (location) qb.andWhere("LOWER(v.location) LIKE :loc", { loc: `%${location.toLowerCase()}%` });
    if (seats !== undefined) qb.andWhere("v.seats >= :seats", { seats });

    switch (sort) {
      case "price_asc":
        qb.orderBy("v.pricePerDay", "ASC");
        break;
      case "price_desc":
        qb.orderBy("v.pricePerDay", "DESC");
        break;
      case "rating":
        qb.orderBy("v.averageRating", "DESC");
        break;
      default:
        qb.orderBy("RANDOM()");
    }

    const total = await qb.getCount();
    const vehicles = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { vehicles, total };
  }

  async getVehicleById(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findOne({
      where: { id },
      relations: ["host"],
    });
    if (!vehicle) throw new AppError("Vehicle not found", 404);
    return vehicle;
  }

  async getHostVehicles(hostId: string): Promise<Vehicle[]> {
    return this.repo.find({
      where: { hostId },
      order: { createdAt: "DESC" },
    });
  }

  async updateVehicle(
    id: string,
    hostId: string,
    role: string,
    updates: Partial<CreateVehicleInput> & { isAvailable?: boolean },
    files?: Express.Multer.File[]
  ): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(id);

    if (role !== "admin" && vehicle.hostId !== hostId) {
      throw new AppError("Not authorised to update this vehicle", 403);
    }

    // Remove specific images if requested
    let currentImages = [...(vehicle.images ?? [])];
    const toRemove = (updates as any).removeImagePublicIds as string | string[] | undefined;
    if (toRemove) {
      const removeSet = Array.isArray(toRemove) ? toRemove : [toRemove];
      for (const pubId of removeSet) {
        await cloudinaryService.deleteImage(pubId).catch(() => null);
      }
      currentImages = currentImages.filter((img) => !removeSet.includes(img.publicId));
      vehicle.images = currentImages;
    }

    // Upload new images if provided, appending to current set
    if (files && files.length > 0) {
      const uploadedImages: { url: string; publicId: string }[] = [];
      for (const file of files) {
        const result = await cloudinaryService.uploadImage(file, "vehicles");
        uploadedImages.push(result);
      }
      vehicle.images = [...currentImages, ...uploadedImages];
    }

    // Strip removeImagePublicIds before applying remaining field updates
    const { removeImagePublicIds: _r, ...cleanUpdates } = updates as any;
    if ("cautionFee" in cleanUpdates) {
      cleanUpdates.cautionFee = cleanUpdates.cautionFee === "" || cleanUpdates.cautionFee == null
        ? null
        : Number(cleanUpdates.cautionFee);
    }
    Object.assign(vehicle, cleanUpdates);
    return this.repo.save(vehicle) as unknown as Vehicle;
  }

  async deleteVehicle(id: string, hostId: string, role: string): Promise<void> {
    const vehicle = await this.getVehicleById(id);

    if (role !== "admin" && vehicle.hostId !== hostId) {
      throw new AppError("Not authorised to delete this vehicle", 403);
    }

    for (const img of vehicle.images) {
      if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
    }

    await this.repo.remove(vehicle);
  }

  async toggleAvailability(id: string, hostId: string): Promise<Vehicle> {
    const vehicle = await this.getVehicleById(id);
    if (vehicle.hostId !== hostId) throw new AppError("Not authorised", 403);
    vehicle.isAvailable = !vehicle.isAvailable;
    return this.repo.save(vehicle) as unknown as Vehicle;
  }
}

export const vehicleService = new VehicleService();
