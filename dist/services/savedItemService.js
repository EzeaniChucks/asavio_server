"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savedItemService = void 0;
// src/services/savedItemService.ts
const database_1 = require("../config/database");
const SavedItem_1 = require("../entities/SavedItem");
const MAX_SAVED_IDS = 500;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
class SavedItemService {
    get repo() {
        return database_1.AppDataSource.getRepository(SavedItem_1.SavedItem);
    }
    /** Toggle save. Returns { saved: true } if added, { saved: false } if removed. */
    async toggle(userId, propertyId, vehicleId) {
        const where = propertyId ? { userId, propertyId } : { userId, vehicleId };
        const existing = await this.repo.findOne({ where: where });
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
    /** Returns a paginated list of saved properties for a user (with images). */
    async getSavedProperties(userId, page = 1, limit = DEFAULT_PAGE_SIZE) {
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
    /** Returns the set of saved propertyIds and vehicleIds for a user — for bulk "is saved?" checks. */
    async getSavedIds(userId) {
        const items = await this.repo.find({
            where: { userId },
            select: ["propertyId", "vehicleId"],
            take: MAX_SAVED_IDS,
            order: { createdAt: "DESC" },
        });
        return {
            propertyIds: items.filter((i) => i.propertyId).map((i) => i.propertyId),
            vehicleIds: items.filter((i) => i.vehicleId).map((i) => i.vehicleId),
        };
    }
}
exports.savedItemService = new SavedItemService();
//# sourceMappingURL=savedItemService.js.map