// src/services/eventCenterService.ts
import { AppDataSource } from "../config/database";
import { EventCenter } from "../entities/EventCenter";
import { EventSpace } from "../entities/EventSpace";
import { EventCenterImage } from "../entities/EventCenterImage";
import { EventSpaceImage } from "../entities/EventSpaceImage";
import { AppError } from "../utils/AppError";
import { CloudinaryService } from "./cloudinaryService";
import { subscriptionService } from "./subscriptionService";
import { settingsService } from "./settingsService";
import { In } from "typeorm";

const cloudinaryService = new CloudinaryService();

interface CreateEventCenterInput {
  name: string;
  description: string;
  location: EventCenter["location"];
  amenities?: string[];
  nearbyPlaces?: string[] | null;
  allowedEventTypes?: string[];
  blockedEventTypes?: string[];
  cancellationPolicy?: string;
}

interface EventCenterFilters {
  city?: string;
  eventType?: string;
  minCapacity?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

interface CreateEventSpaceInput {
  name: string;
  description?: string;
  capacity: number | string;
  pricingMode: "hourly" | "daily" | "package" | "hybrid";
  hourlyRate?: number | string | null;
  minHours?: number | string;
  dailyRate?: number | string | null;
  packageName?: string;
  packageRate?: number | string | null;
  packageHoursIncluded?: number | string | null;
  packageDescription?: string;
  setupMinutes?: number | string;
  teardownMinutes?: number | string;
}

class EventCenterService {
  private get ecRepo()     { return AppDataSource.getRepository(EventCenter); }
  private get spaceRepo()  { return AppDataSource.getRepository(EventSpace); }
  private get ecImgRepo()  { return AppDataSource.getRepository(EventCenterImage); }
  private get esImgRepo()  { return AppDataSource.getRepository(EventSpaceImage); }

  // ── Create ────────────────────────────────────────────────────────────

  async createEventCenter(
    hostId: string,
    input: CreateEventCenterInput,
    files: Express.Multer.File[]
  ): Promise<EventCenter> {
    await subscriptionService.checkListingLimit(hostId, "event_center");

    const ec = this.ecRepo.create({
      name: input.name,
      description: input.description,
      location: input.location,
      amenities: input.amenities ?? [],
      nearbyPlaces: input.nearbyPlaces ?? null,
      allowedEventTypes: input.allowedEventTypes ?? [],
      blockedEventTypes: input.blockedEventTypes ?? [],
      cancellationPolicy: input.cancellationPolicy || "flexible",
      status: "pending",
      isAvailable: false,
      hostId,
    });

    const saved = await this.ecRepo.save(ec);

    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const result = await cloudinaryService.uploadImage(files[i], "event-centers");
        await this.ecImgRepo.save(
          this.ecImgRepo.create({
            eventCenterId: saved.id,
            url: result.url,
            publicId: result.publicId,
            isPrimary: i === 0,
          })
        );
      }
    }

    return this.getById(saved.id);
  }

  // ── Read ──────────────────────────────────────────────────────────────

  async getById(id: string): Promise<EventCenter> {
    const ec = await this.ecRepo.findOne({
      where: { id },
      relations: ["host", "images", "spaces", "spaces.images"],
    });
    if (!ec) throw new AppError("Event center not found", 404);
    return ec;
  }

  async getAll(filters: EventCenterFilters = {}): Promise<{ eventCenters: EventCenter[]; total: number }> {
    const { city, eventType, minCapacity, minPrice, maxPrice, sort = "newest", page = 1, limit = 12 } = filters;

    const qb = this.ecRepo
      .createQueryBuilder("ec")
      .innerJoinAndSelect("ec.host", "host")
      .leftJoinAndSelect("ec.images", "images")
      .leftJoinAndSelect("ec.spaces", "spaces")
      .leftJoinAndSelect("spaces.images", "spaceImages")
      .where("ec.isAvailable = :avail", { avail: true })
      .andWhere("ec.status = :ecstatus", { ecstatus: "approved" })
      .andWhere("host.kycStatus = :kycStatus", { kycStatus: "approved" });

    if (city) qb.andWhere("LOWER(ec.location->>'city') = LOWER(:city)", { city });

    if (eventType) {
      // Must be in allowed list (or allowed list is empty = all welcome) AND not in blocked list
      qb.andWhere(
        "(ec.\"allowedEventTypes\" = '[]'::jsonb OR ec.\"allowedEventTypes\" @> :etArr::jsonb)",
        { etArr: JSON.stringify([eventType]) }
      );
      qb.andWhere(
        "NOT (ec.\"blockedEventTypes\" @> :etBlk::jsonb)",
        { etBlk: JSON.stringify([eventType]) }
      );
    }

    if (minCapacity !== undefined) {
      qb.andWhere("spaces.capacity >= :minCap", { minCap: minCapacity });
    }

    // Price filters on cheapest hourly/daily/package rate across spaces
    if (minPrice !== undefined) {
      qb.andWhere(
        "(spaces.\"hourlyRate\" >= :minP OR spaces.\"dailyRate\" >= :minP OR spaces.\"packageRate\" >= :minP)",
        { minP: minPrice }
      );
    }
    if (maxPrice !== undefined) {
      qb.andWhere(
        "(spaces.\"hourlyRate\" <= :maxP OR spaces.\"dailyRate\" <= :maxP OR spaces.\"packageRate\" <= :maxP)",
        { maxP: maxPrice }
      );
    }

    switch (sort) {
      case "rating": qb.addOrderBy("ec.averageRating", "DESC"); break;
      default:       qb.addOrderBy("ec.createdAt", "DESC");
    }

    const total = await qb.getCount();
    const eventCenters = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { eventCenters, total };
  }

  async getHostEventCenters(hostId: string): Promise<EventCenter[]> {
    return this.ecRepo.find({
      where: { hostId },
      relations: ["images", "spaces", "spaces.images"],
      order: { createdAt: "DESC" },
    });
  }

  // ── Update / Delete ───────────────────────────────────────────────────

  async update(
    id: string,
    hostId: string,
    role: string,
    updates: Partial<CreateEventCenterInput> & { isAvailable?: boolean },
    files?: Express.Multer.File[]
  ): Promise<EventCenter> {
    const ec = await this.getById(id);
    if (role !== "admin" && ec.hostId !== hostId) throw new AppError("Not authorised", 403);

    const toRemove = (updates as any).removeImagePublicIds as string | string[] | undefined;
    if (toRemove) {
      const removeSet = Array.isArray(toRemove) ? toRemove : [toRemove];
      for (const pubId of removeSet) {
        await cloudinaryService.deleteImage(pubId).catch(() => null);
        await this.ecImgRepo.delete({ eventCenterId: id, publicId: pubId });
      }
    }
    if (files?.length) {
      for (const file of files) {
        const result = await cloudinaryService.uploadImage(file, "event-centers");
        await this.ecImgRepo.save(this.ecImgRepo.create({ eventCenterId: id, url: result.url, publicId: result.publicId }));
      }
    }

    const { removeImagePublicIds: _r, ...clean } = updates as any;
    Object.assign(ec, clean);
    await this.ecRepo.save(ec);
    return this.getById(id);
  }

  async deleteEventCenter(id: string, hostId: string, role: string): Promise<void> {
    const ec = await this.getById(id);
    if (role !== "admin" && ec.hostId !== hostId) throw new AppError("Not authorised", 403);
    for (const img of ec.images ?? []) {
      if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
    }
    for (const space of ec.spaces ?? []) {
      for (const img of space.images ?? []) {
        if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
      }
    }
    await this.ecRepo.remove(ec);
  }

  async toggleAvailability(id: string, hostId: string): Promise<EventCenter> {
    const ec = await this.getById(id);
    if (ec.hostId !== hostId) throw new AppError("Not authorised", 403);
    ec.isAvailable = !ec.isAvailable;
    await this.ecRepo.save(ec);
    return ec;
  }

  // ── Spaces ────────────────────────────────────────────────────────────

  async createSpace(
    eventCenterId: string,
    hostId: string,
    role: string,
    input: CreateEventSpaceInput,
    files: Express.Multer.File[]
  ): Promise<EventSpace> {
    const ec = await this.getById(eventCenterId);
    if (role !== "admin" && ec.hostId !== hostId) throw new AppError("Not authorised", 403);

    // Tier limit: max spaces per event center
    const tierConfig = await settingsService.getActiveTierConfig();
    const effectiveTier = (ec.host?.subscriptionTier ?? "starter") as "starter" | "pro" | "elite";
    const limit = tierConfig[effectiveTier].maxEventSpaces;
    if (limit !== Infinity) {
      const current = await this.spaceRepo.count({ where: { eventCenterId } });
      if (current >= limit) {
        throw new AppError(
          `Your ${tierConfig[effectiveTier].label} plan allows up to ${limit} spaces per event center. Upgrade to add more.`,
          403
        );
      }
    }

    const space = this.spaceRepo.create({
      eventCenterId,
      name: input.name,
      description: input.description || null,
      capacity: Number(input.capacity),
      pricingMode: input.pricingMode,
      hourlyRate: input.hourlyRate != null && input.hourlyRate !== "" ? Number(input.hourlyRate) : null,
      minHours: Number(input.minHours ?? 4),
      dailyRate: input.dailyRate != null && input.dailyRate !== "" ? Number(input.dailyRate) : null,
      packageName: input.packageName || null,
      packageRate: input.packageRate != null && input.packageRate !== "" ? Number(input.packageRate) : null,
      packageHoursIncluded: input.packageHoursIncluded != null && input.packageHoursIncluded !== "" ? Number(input.packageHoursIncluded) : null,
      packageDescription: input.packageDescription || null,
      setupMinutes: Number(input.setupMinutes ?? 60),
      teardownMinutes: Number(input.teardownMinutes ?? 60),
    });
    const saved = await this.spaceRepo.save(space);

    if (files?.length) {
      for (let i = 0; i < files.length; i++) {
        const result = await cloudinaryService.uploadImage(files[i], "event-spaces");
        await this.esImgRepo.save(this.esImgRepo.create({
          eventSpaceId: saved.id, url: result.url, publicId: result.publicId, isPrimary: i === 0,
        }));
      }
    }

    return this.getSpaceById(saved.id);
  }

  async getSpaceById(id: string): Promise<EventSpace> {
    const space = await this.spaceRepo.findOne({ where: { id }, relations: ["images", "eventCenter"] });
    if (!space) throw new AppError("Event space not found", 404);
    return space;
  }

  async updateSpace(
    spaceId: string,
    hostId: string,
    role: string,
    updates: Partial<CreateEventSpaceInput>,
    files?: Express.Multer.File[]
  ): Promise<EventSpace> {
    const space = await this.getSpaceById(spaceId);
    if (role !== "admin" && space.eventCenter?.hostId !== hostId) throw new AppError("Not authorised", 403);

    const toRemove = (updates as any).removeImagePublicIds as string | string[] | undefined;
    if (toRemove) {
      const removeSet = Array.isArray(toRemove) ? toRemove : [toRemove];
      for (const pubId of removeSet) {
        await cloudinaryService.deleteImage(pubId).catch(() => null);
        await this.esImgRepo.delete({ eventSpaceId: spaceId, publicId: pubId });
      }
    }
    if (files?.length) {
      for (const file of files) {
        const result = await cloudinaryService.uploadImage(file, "event-spaces");
        await this.esImgRepo.save(this.esImgRepo.create({ eventSpaceId: spaceId, url: result.url, publicId: result.publicId }));
      }
    }

    const { removeImagePublicIds: _r, ...clean } = updates as any;
    // Coerce numeric fields
    if ("capacity" in clean) clean.capacity = Number(clean.capacity);
    if ("hourlyRate" in clean) clean.hourlyRate = clean.hourlyRate != null && clean.hourlyRate !== "" ? Number(clean.hourlyRate) : null;
    if ("dailyRate" in clean) clean.dailyRate = clean.dailyRate != null && clean.dailyRate !== "" ? Number(clean.dailyRate) : null;
    if ("packageRate" in clean) clean.packageRate = clean.packageRate != null && clean.packageRate !== "" ? Number(clean.packageRate) : null;
    if ("packageHoursIncluded" in clean) clean.packageHoursIncluded = clean.packageHoursIncluded != null && clean.packageHoursIncluded !== "" ? Number(clean.packageHoursIncluded) : null;
    if ("minHours" in clean) clean.minHours = Number(clean.minHours);
    if ("setupMinutes" in clean) clean.setupMinutes = Number(clean.setupMinutes);
    if ("teardownMinutes" in clean) clean.teardownMinutes = Number(clean.teardownMinutes);

    Object.assign(space, clean);
    await this.spaceRepo.save(space);
    return this.getSpaceById(spaceId);
  }

  async deleteSpace(spaceId: string, hostId: string, role: string): Promise<void> {
    const space = await this.getSpaceById(spaceId);
    if (role !== "admin" && space.eventCenter?.hostId !== hostId) throw new AppError("Not authorised", 403);
    for (const img of space.images ?? []) {
      if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
    }
    await this.spaceRepo.remove(space);
  }
}

export const eventCenterService = new EventCenterService();
