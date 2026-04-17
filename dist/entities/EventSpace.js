"use strict";
// src/entities/EventSpace.ts
// A bookable sub-space within an event center (e.g. Main Hall, VIP Lounge, Garden).
// Each space has its own capacity, pricing mode, and availability.
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventSpace = void 0;
const typeorm_1 = require("typeorm");
const EventCenter_1 = require("./EventCenter");
const EventSpaceImage_1 = require("./EventSpaceImage");
let EventSpace = class EventSpace {
};
exports.EventSpace = EventSpace;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EventSpace.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventSpace.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { nullable: true }),
    __metadata("design:type", Object)
], EventSpace.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], EventSpace.prototype, "capacity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", default: "hourly" }),
    __metadata("design:type", String)
], EventSpace.prototype, "pricingMode", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EventSpace.prototype, "hourlyRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", default: 4 }),
    __metadata("design:type", Number)
], EventSpace.prototype, "minHours", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EventSpace.prototype, "dailyRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], EventSpace.prototype, "packageName", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EventSpace.prototype, "packageRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", nullable: true }),
    __metadata("design:type", Object)
], EventSpace.prototype, "packageHoursIncluded", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { nullable: true }),
    __metadata("design:type", Object)
], EventSpace.prototype, "packageDescription", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", default: 60 }),
    __metadata("design:type", Number)
], EventSpace.prototype, "setupMinutes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", default: 60 }),
    __metadata("design:type", Number)
], EventSpace.prototype, "teardownMinutes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => EventCenter_1.EventCenter, (ec) => ec.spaces, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "eventCenterId" }),
    __metadata("design:type", EventCenter_1.EventCenter)
], EventSpace.prototype, "eventCenter", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventSpace.prototype, "eventCenterId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EventSpaceImage_1.EventSpaceImage, (img) => img.eventSpace, { cascade: true }),
    __metadata("design:type", Array)
], EventSpace.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EventSpace.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EventSpace.prototype, "updatedAt", void 0);
exports.EventSpace = EventSpace = __decorate([
    (0, typeorm_1.Entity)("event_spaces")
], EventSpace);
//# sourceMappingURL=EventSpace.js.map