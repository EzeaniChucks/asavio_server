// src/services/savedItemService.ts
import { AppDataSource } from "../config/database";
import { SavedItem } from "../entities/SavedItem";

class SavedItemService {
  private get repo() {
    return AppDataSource.getRepository(SavedItem);
  }

  /** Toggle save. Returns { saved: true } if added, { saved: false } if removed. */
  async toggle(userId: string, propertyId?: string, vehicleId?: string) {
    const where = propertyId ? { userId, propertyId } : { userId, vehicleId };
    const existing = await this.repo.findOne({ where: where as any });

    if (existing) {
      await this.repo.remove(existing);
      return { saved: false };
    }

    const item = this.repo.create({
      userId,
      propertyId: propertyId ?? null,
      vehicleId: vehicleId ?? null,
    });
    await this.repo.save(item);
    return { saved: true };
  }

  /** Returns all saved properties for a user (with images). */
  async getSavedProperties(userId: string) {
    const items = await this.repo.find({
      where: { userId },
      relations: ["property", "property.images", "vehicle"],
      order: { createdAt: "DESC" },
    });
    return items.filter((i) => i.propertyId !== null);
  }

  /** Returns the set of saved propertyIds for a user — for bulk "is saved?" checks. */
  async getSavedIds(userId: string): Promise<{ propertyIds: string[]; vehicleIds: string[] }> {
    const items = await this.repo.find({
      where: { userId },
      select: ["propertyId", "vehicleId"],
    });
    return {
      propertyIds: items.filter((i) => i.propertyId).map((i) => i.propertyId!),
      vehicleIds: items.filter((i) => i.vehicleId).map((i) => i.vehicleId!),
    };
  }
}

export const savedItemService = new SavedItemService();
