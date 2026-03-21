"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savedItemService = void 0;
// src/services/savedItemService.ts
const database_1 = require("../config/database");
const SavedItem_1 = require("../entities/SavedItem");
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
    /** Returns all saved properties for a user (with images). */
    async getSavedProperties(userId) {
        const items = await this.repo.find({
            where: { userId },
            relations: ["property", "property.images", "vehicle"],
            order: { createdAt: "DESC" },
        });
        return items.filter((i) => i.propertyId !== null);
    }
    /** Returns the set of saved propertyIds for a user — for bulk "is saved?" checks. */
    async getSavedIds(userId) {
        const items = await this.repo.find({
            where: { userId },
            select: ["propertyId", "vehicleId"],
        });
        return {
            propertyIds: items.filter((i) => i.propertyId).map((i) => i.propertyId),
            vehicleIds: items.filter((i) => i.vehicleId).map((i) => i.vehicleId),
        };
    }
}
exports.savedItemService = new SavedItemService();
//# sourceMappingURL=savedItemService.js.map