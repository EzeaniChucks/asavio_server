// src/services/vehicleService.ts
import { AppDataSource } from "../config/database";
import { Vehicle } from "../entities/Vehicle";
import { AppError } from "../utils/AppError";
import { CloudinaryService } from "./cloudinaryService";
import * as fs from "fs";

const cloudinaryService = new CloudinaryService();

interface CreateVehicleInput {
  make: string;
  model: string;
  year: number;
  vehicleType: string;
  pricePerDay: number;
  priceWithDriverPerDay?: number | null;
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
      try {
        const result = await cloudinaryService.uploadImage(file, "vehicles");
        uploadedImages.push(result);
      } finally {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    }

    const vehicle = this.repo.create({
      ...input,
      year: Number(input.year),
      pricePerDay: Number(input.pricePerDay),
      priceWithDriverPerDay: input.priceWithDriverPerDay != null ? Number(input.priceWithDriverPerDay) : null,
      seats: Number(input.seats),
      withDriver: input.withDriver ?? false,
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
      .orderBy("vehicle.vehicleType", "ASC")
      .getRawMany();
    return rows.map((r) => r.type as string);
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
        qb.orderBy("v.createdAt", "DESC");
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

    if (files && files.length > 0) {
      const uploadedImages: { url: string; publicId: string }[] = [];
      for (const file of files) {
        try {
          const result = await cloudinaryService.uploadImage(file, "vehicles");
          uploadedImages.push(result);
        } finally {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        }
      }
      for (const img of vehicle.images) {
        if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
      }
      vehicle.images = uploadedImages;
    }

    Object.assign(vehicle, updates);
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
