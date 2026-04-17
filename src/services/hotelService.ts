// src/services/hotelService.ts
import { AppDataSource } from "../config/database";
import { Hotel } from "../entities/Hotel";
import { RoomType } from "../entities/RoomType";
import { HotelImage } from "../entities/HotelImage";
import { RoomTypeImage } from "../entities/RoomTypeImage";
import { Booking } from "../entities/Booking";
import { AppError } from "../utils/AppError";
import { CloudinaryService } from "./cloudinaryService";
import { settingsService } from "./settingsService";
import { subscriptionService } from "./subscriptionService";
import { In } from "typeorm";

const cloudinaryService = new CloudinaryService();

interface CreateHotelInput {
  name: string;
  description: string;
  hotelType?: string;
  starRating?: number | string | null;
  location: Hotel["location"];
  amenities?: string[];
  nearbyPlaces?: string[] | null;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  checkInInstructions?: string;
}

interface HotelFilters {
  city?: string;
  hotelType?: string;
  star?: number; // minimum star
  minPrice?: number; // min pricePerNight across room types
  maxPrice?: number;
  guests?: number; // filter hotels that have at least one room type fitting
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  limit?: number;
}

interface CreateRoomTypeInput {
  name: string;
  description?: string;
  pricePerNight: number | string;
  maxGuests: number | string;
  totalUnits?: number | string;
  bedType?: string;
  roomSize?: string;
  roomAmenities?: string[];
  cautionFee?: number | string | null;
}

class HotelService {
  private get hotelRepo()    { return AppDataSource.getRepository(Hotel); }
  private get roomRepo()     { return AppDataSource.getRepository(RoomType); }
  private get hotelImgRepo() { return AppDataSource.getRepository(HotelImage); }
  private get roomImgRepo()  { return AppDataSource.getRepository(RoomTypeImage); }
  private get bookingRepo()  { return AppDataSource.getRepository(Booking); }

  // ── Create ────────────────────────────────────────────────────────────

  async createHotel(
    hostId: string,
    input: CreateHotelInput,
    files: Express.Multer.File[]
  ): Promise<Hotel> {
    // Tier limit check
    await subscriptionService.checkListingLimit(hostId, "hotel");

    // Normalise star rating input
    let starRating: number | null = null;
    if (input.starRating !== undefined && input.starRating !== null && input.starRating !== "") {
      const n = Number(input.starRating);
      if (Number.isFinite(n) && n >= 1 && n <= 5) starRating = Math.round(n);
    }

    const hotel = this.hotelRepo.create({
      name: input.name,
      description: input.description,
      hotelType: input.hotelType || "Hotel",
      starRating,
      verifiedStarRating: false,
      location: input.location,
      amenities: input.amenities ?? [],
      nearbyPlaces: input.nearbyPlaces ?? null,
      checkInTime: input.checkInTime || "14:00",
      checkOutTime: input.checkOutTime || "11:00",
      cancellationPolicy: input.cancellationPolicy || "flexible",
      checkInInstructions: input.checkInInstructions || undefined,
      status: "pending",
      isAvailable: false, // flips true once admin approves
      hostId,
    });

    const saved = await this.hotelRepo.save(hotel);

    // Upload hotel-wide images
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const result = await cloudinaryService.uploadImage(files[i], "hotels");
        await this.hotelImgRepo.save(
          this.hotelImgRepo.create({
            hotelId: saved.id,
            url: result.url,
            publicId: result.publicId,
            isPrimary: i === 0,
          })
        );
      }
    }

    return this.getHotelById(saved.id);
  }

  // ── Read ──────────────────────────────────────────────────────────────

  async getHotelById(id: string): Promise<Hotel> {
    const hotel = await this.hotelRepo.findOne({
      where: { id },
      relations: ["host", "images", "roomTypes", "roomTypes.images"],
    });
    if (!hotel) throw new AppError("Hotel not found", 404);
    return hotel;
  }

  async getHotels(filters: HotelFilters = {}): Promise<{ hotels: Hotel[]; total: number }> {
    const {
      city,
      hotelType,
      star,
      minPrice,
      maxPrice,
      guests,
      sort = "newest",
      page = 1,
      limit = 12,
    } = filters;

    const qb = this.hotelRepo
      .createQueryBuilder("h")
      .innerJoinAndSelect("h.host", "host")
      .leftJoinAndSelect("h.images", "images")
      .leftJoinAndSelect("h.roomTypes", "roomTypes")
      .leftJoinAndSelect("roomTypes.images", "roomImages")
      .where("h.isAvailable = :avail", { avail: true })
      .andWhere("h.status = :hstatus", { hstatus: "approved" })
      .andWhere("host.kycStatus = :kycStatus", { kycStatus: "approved" });

    if (city) {
      qb.andWhere("LOWER(h.location->>'city') = LOWER(:city)", { city });
    }
    if (hotelType) qb.andWhere("h.hotelType = :hotelType", { hotelType });
    if (star !== undefined) qb.andWhere("h.starRating >= :star", { star });

    // Price filters go against the cheapest room type per hotel
    if (minPrice !== undefined || maxPrice !== undefined || guests !== undefined) {
      const sub = AppDataSource.getRepository(RoomType)
        .createQueryBuilder("rt")
        .select("rt.hotelId", "hotelId")
        .groupBy("rt.hotelId");
      qb.andWhere((qbInner) => {
        const subQ = sub.clone();
        if (minPrice !== undefined) subQ.andWhere("rt.pricePerNight >= :minPrice", { minPrice });
        if (maxPrice !== undefined) subQ.andWhere("rt.pricePerNight <= :maxPrice", { maxPrice });
        if (guests !== undefined) subQ.andWhere("rt.maxGuests >= :guests", { guests });
        return "h.id IN (" + subQ.getQuery() + ")";
      });
      if (minPrice !== undefined) qb.setParameter("minPrice", minPrice);
      if (maxPrice !== undefined) qb.setParameter("maxPrice", maxPrice);
      if (guests !== undefined) qb.setParameter("guests", guests);
    }

    switch (sort) {
      case "price_asc":
        qb.addOrderBy("roomTypes.pricePerNight", "ASC");
        break;
      case "price_desc":
        qb.addOrderBy("roomTypes.pricePerNight", "DESC");
        break;
      case "rating":
        qb.addOrderBy("h.averageRating", "DESC");
        break;
      default:
        qb.addOrderBy("h.createdAt", "DESC");
    }

    const total = await qb.getCount();
    const hotels = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { hotels, total };
  }

  async getHostHotels(hostId: string): Promise<Hotel[]> {
    return this.hotelRepo.find({
      where: { hostId },
      relations: ["images", "roomTypes", "roomTypes.images"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Returns one representative hotel per hotelType for the homepage "browse by type" section.
   */
  async getHotelTypeRepresentatives(): Promise<Hotel[]> {
    const rows = await AppDataSource.query<{ id: string }[]>(`
      SELECT DISTINCT ON (LOWER(h."hotelType")) h.id
      FROM hotels h
      INNER JOIN users host ON host.id = h."hostId"
      WHERE h."isAvailable" = true AND h."status" = 'approved'
        AND host."kycStatus" = 'approved'
      ORDER BY LOWER(h."hotelType"), h."averageRating" DESC, h."createdAt" DESC
    `);

    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const hotels = await this.hotelRepo.find({
      where: { id: In(ids) },
      relations: ["host", "images", "roomTypes", "roomTypes.images"],
    });
    return ids.map((id) => hotels.find((h) => h.id === id)!).filter(Boolean);
  }

  async getAvailableHotelTypes(): Promise<string[]> {
    const rows = await AppDataSource.getRepository(Hotel)
      .createQueryBuilder("hotel")
      .select("DISTINCT hotel.hotelType", "type")
      .where("hotel.isAvailable = :isAvailable", { isAvailable: true })
      .andWhere("hotel.status = :status", { status: "approved" })
      .orderBy("hotel.hotelType", "ASC")
      .getRawMany();
    return rows.map((r) => r.type as string);
  }

  // ── Update ────────────────────────────────────────────────────────────

  async updateHotel(
    id: string,
    hostId: string,
    role: string,
    updates: Partial<CreateHotelInput> & { isAvailable?: boolean },
    files?: Express.Multer.File[]
  ): Promise<Hotel> {
    const hotel = await this.getHotelById(id);
    if (role !== "admin" && hotel.hostId !== hostId) {
      throw new AppError("Not authorised to update this hotel", 403);
    }

    // Remove selected images if requested
    const toRemove = (updates as any).removeImagePublicIds as string | string[] | undefined;
    if (toRemove) {
      const removeSet = Array.isArray(toRemove) ? toRemove : [toRemove];
      for (const pubId of removeSet) {
        await cloudinaryService.deleteImage(pubId).catch(() => null);
        await this.hotelImgRepo.delete({ hotelId: id, publicId: pubId });
      }
    }

    // Upload new images if provided
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await cloudinaryService.uploadImage(file, "hotels");
        await this.hotelImgRepo.save(
          this.hotelImgRepo.create({
            hotelId: id,
            url: result.url,
            publicId: result.publicId,
          })
        );
      }
    }

    const { removeImagePublicIds: _r, ...cleanUpdates } = updates as any;

    if ("starRating" in cleanUpdates) {
      const n = Number(cleanUpdates.starRating);
      cleanUpdates.starRating = Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : null;
      // Host-initiated star edits reset verification
      if (role !== "admin") cleanUpdates.verifiedStarRating = false;
    }

    Object.assign(hotel, cleanUpdates);
    await this.hotelRepo.save(hotel);
    return this.getHotelById(id);
  }

  // ── Delete ────────────────────────────────────────────────────────────

  async deleteHotel(id: string, hostId: string, role: string): Promise<void> {
    const hotel = await this.getHotelById(id);
    if (role !== "admin" && hotel.hostId !== hostId) {
      throw new AppError("Not authorised to delete this hotel", 403);
    }
    // Delete all Cloudinary images
    for (const img of hotel.images ?? []) {
      if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
    }
    for (const room of hotel.roomTypes ?? []) {
      for (const img of room.images ?? []) {
        if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
      }
    }
    await this.hotelRepo.remove(hotel);
  }

  async toggleAvailability(id: string, hostId: string): Promise<Hotel> {
    const hotel = await this.getHotelById(id);
    if (hotel.hostId !== hostId) throw new AppError("Not authorised", 403);
    hotel.isAvailable = !hotel.isAvailable;
    await this.hotelRepo.save(hotel);
    return hotel;
  }

  // ── Room types ────────────────────────────────────────────────────────

  async createRoomType(
    hotelId: string,
    hostId: string,
    role: string,
    input: CreateRoomTypeInput,
    files: Express.Multer.File[]
  ): Promise<RoomType> {
    const hotel = await this.getHotelById(hotelId);
    if (role !== "admin" && hotel.hostId !== hostId) {
      throw new AppError("Not authorised", 403);
    }

    // Tier limit: max room types per hotel
    const tierConfig = await settingsService.getActiveTierConfig();
    const effectiveTier = (hotel.host?.subscriptionTier ?? "starter") as "starter" | "pro" | "elite";
    const limit = tierConfig[effectiveTier].maxRoomTypes;
    if (limit !== Infinity) {
      const current = await this.roomRepo.count({ where: { hotelId } });
      if (current >= limit) {
        throw new AppError(
          `Your ${tierConfig[effectiveTier].label} plan allows up to ${limit} room types per hotel. Upgrade to add more.`,
          403
        );
      }
    }

    const room = this.roomRepo.create({
      hotelId,
      name: input.name,
      description: input.description || null,
      pricePerNight: Number(input.pricePerNight),
      maxGuests: Number(input.maxGuests),
      totalUnits: Number(input.totalUnits ?? 1),
      bedType: input.bedType,
      roomSize: input.roomSize,
      roomAmenities: input.roomAmenities ?? [],
      cautionFee:
        input.cautionFee === "" || input.cautionFee == null ? null : Number(input.cautionFee),
    });
    const saved = await this.roomRepo.save(room);

    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const result = await cloudinaryService.uploadImage(files[i], "room-types");
        await this.roomImgRepo.save(
          this.roomImgRepo.create({
            roomTypeId: saved.id,
            url: result.url,
            publicId: result.publicId,
            isPrimary: i === 0,
          })
        );
      }
    }

    return this.getRoomTypeById(saved.id);
  }

  async getRoomTypeById(id: string): Promise<RoomType> {
    const room = await this.roomRepo.findOne({
      where: { id },
      relations: ["images", "hotel"],
    });
    if (!room) throw new AppError("Room type not found", 404);
    return room;
  }

  async updateRoomType(
    roomId: string,
    hostId: string,
    role: string,
    updates: Partial<CreateRoomTypeInput>,
    files?: Express.Multer.File[]
  ): Promise<RoomType> {
    const room = await this.getRoomTypeById(roomId);
    if (role !== "admin" && room.hotel?.hostId !== hostId) {
      throw new AppError("Not authorised", 403);
    }

    const toRemove = (updates as any).removeImagePublicIds as string | string[] | undefined;
    if (toRemove) {
      const removeSet = Array.isArray(toRemove) ? toRemove : [toRemove];
      for (const pubId of removeSet) {
        await cloudinaryService.deleteImage(pubId).catch(() => null);
        await this.roomImgRepo.delete({ roomTypeId: roomId, publicId: pubId });
      }
    }
    if (files && files.length > 0) {
      for (const file of files) {
        const result = await cloudinaryService.uploadImage(file, "room-types");
        await this.roomImgRepo.save(
          this.roomImgRepo.create({
            roomTypeId: roomId,
            url: result.url,
            publicId: result.publicId,
          })
        );
      }
    }

    const { removeImagePublicIds: _r, ...cleanUpdates } = updates as any;
    if ("cautionFee" in cleanUpdates) {
      cleanUpdates.cautionFee =
        cleanUpdates.cautionFee === "" || cleanUpdates.cautionFee == null
          ? null
          : Number(cleanUpdates.cautionFee);
    }
    if ("pricePerNight" in cleanUpdates) cleanUpdates.pricePerNight = Number(cleanUpdates.pricePerNight);
    if ("maxGuests" in cleanUpdates)     cleanUpdates.maxGuests     = Number(cleanUpdates.maxGuests);
    if ("totalUnits" in cleanUpdates)    cleanUpdates.totalUnits    = Number(cleanUpdates.totalUnits);

    Object.assign(room, cleanUpdates);
    await this.roomRepo.save(room);
    return this.getRoomTypeById(roomId);
  }

  async deleteRoomType(roomId: string, hostId: string, role: string): Promise<void> {
    const room = await this.getRoomTypeById(roomId);
    if (role !== "admin" && room.hotel?.hostId !== hostId) {
      throw new AppError("Not authorised", 403);
    }
    for (const img of room.images ?? []) {
      if (img.publicId) await cloudinaryService.deleteImage(img.publicId).catch(() => null);
    }
    await this.roomRepo.remove(room);
  }

  // ── Availability ──────────────────────────────────────────────────────

  /**
   * Returns all room types for a hotel with `available` units for the given date range.
   * `available` = totalUnits - (sum of overlapping booked quantities).
   */
  async getRoomAvailability(
    hotelId: string,
    checkIn: string,
    checkOut: string
  ): Promise<Array<RoomType & { available: number }>> {
    const hotel = await this.getHotelById(hotelId);
    const rooms = hotel.roomTypes ?? [];
    if (rooms.length === 0) return [];

    // Cut-off: abandoned awaiting_payment bookings older than 45 min are ignored
    const cutoff = new Date(Date.now() - 45 * 60 * 1000);

    const roomIds = rooms.map((r) => r.id);
    const bookings = await this.bookingRepo
      .createQueryBuilder("b")
      .select(["b.roomTypeId", "b.quantity"])
      .where("b.roomTypeId IN (:...roomIds)", { roomIds })
      .andWhere("b.status IN (:...statuses)", { statuses: ["awaiting_payment", "confirmed"] })
      .andWhere(
        "(b.status = 'confirmed' OR b.paymentStatus = 'paid' OR b.paystackReference IS NOT NULL OR b.createdAt > :cutoff)",
        { cutoff }
      )
      .andWhere("NOT (b.checkOut <= :ci OR b.checkIn >= :co)", { ci: checkIn, co: checkOut })
      .getMany();

    const bookedByRoom = new Map<string, number>();
    for (const b of bookings) {
      if (!b.roomTypeId) continue;
      bookedByRoom.set(b.roomTypeId, (bookedByRoom.get(b.roomTypeId) ?? 0) + (b.quantity ?? 1));
    }

    return rooms.map((r) => ({
      ...r,
      available: Math.max(0, r.totalUnits - (bookedByRoom.get(r.id) ?? 0)),
    })) as Array<RoomType & { available: number }>;
  }
}

export const hotelService = new HotelService();
