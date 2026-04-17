// src/services/savedItemService.ts
import { AppDataSource } from "../config/database";
import { SavedItem } from "../entities/SavedItem";

const MAX_SAVED_IDS = 500;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

class SavedItemService {
  private get repo() {
    return AppDataSource.getRepository(SavedItem);
  }

  /** Toggle save. Returns { saved: true } if added, { saved: false } if removed. */
  async toggle(userId: string, propertyId?: string, vehicleId?: string, hotelId?: string, eventCenterId?: string) {
    const where = propertyId
      ? { userId, propertyId }
      : vehicleId
      ? { userId, vehicleId }
      : hotelId
      ? { userId, hotelId }
      : { userId, eventCenterId };
    const existing = await this.repo.findOne({ where: where as any });

    if (existing) {
      await this.repo.remove(existing);
      return { saved: false };
    }

    const item = this.repo.create({
      userId,
      propertyId: propertyId ?? null,
      vehicleId: vehicleId ?? null,
      hotelId: hotelId ?? null,
      eventCenterId: eventCenterId ?? null,
    });
    await this.repo.save(item);
    return { saved: true };
  }

  /** Returns a paginated list of saved properties for a user (with images). */
  async getSavedProperties(userId: string, page = 1, limit = DEFAULT_PAGE_SIZE) {
    const take = Math.min(limit, MAX_PAGE_SIZE);
    const skip = (page - 1) * take;

    const [items, total] = await this.repo.findAndCount({
      where: { userId },
      relations: ["property", "property.images", "vehicle"],
      order: { createdAt: "DESC" },
      take,
      skip,
    });

    const filtered = items.filter((i) => i.propertyId !== null);
    return { items: filtered, total, page, limit: take };
  }

  /** Returns the set of saved IDs for a user — for bulk "is saved?" checks. */
  async getSavedIds(userId: string): Promise<{ propertyIds: string[]; vehicleIds: string[]; hotelIds: string[]; eventCenterIds: string[] }> {
    const items = await this.repo.find({
      where: { userId },
      select: ["propertyId", "vehicleId", "hotelId", "eventCenterId"],
      take: MAX_SAVED_IDS,
      order: { createdAt: "DESC" },
    });
    return {
      propertyIds:    items.filter((i) => i.propertyId).map((i) => i.propertyId!),
      vehicleIds:     items.filter((i) => i.vehicleId).map((i) => i.vehicleId!),
      hotelIds:       items.filter((i) => i.hotelId).map((i) => i.hotelId!),
      eventCenterIds: items.filter((i) => i.eventCenterId).map((i) => i.eventCenterId!),
    };
  }
}

export const savedItemService = new SavedItemService();
