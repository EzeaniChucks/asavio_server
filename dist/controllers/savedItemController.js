"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savedItemController = void 0;
const catchAsync_1 = require("../utils/catchAsync");
const savedItemService_1 = require("../services/savedItemService");
exports.savedItemController = {
    toggle: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const { propertyId, vehicleId } = req.body;
        const result = await savedItemService_1.savedItemService.toggle(userId, propertyId, vehicleId);
        res.json({ status: "success", data: result });
    }),
    getSavedProperties: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.max(1, parseInt(req.query.limit) || 20);
        const result = await savedItemService_1.savedItemService.getSavedProperties(userId, page, limit);
        res.json({ status: "success", data: result });
    }),
    getSavedIds: (0, catchAsync_1.catchAsync)(async (req, res) => {
        const userId = req.user.id;
        const ids = await savedItemService_1.savedItemService.getSavedIds(userId);
        res.json({ status: "success", data: ids });
    }),
};
//# sourceMappingURL=savedItemController.js.map