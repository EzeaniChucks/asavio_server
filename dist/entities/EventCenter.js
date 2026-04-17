"use strict";
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
exports.EventCenter = void 0;
// src/entities/EventCenter.ts
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const EventSpace_1 = require("./EventSpace");
const EventCenterImage_1 = require("./EventCenterImage");
let EventCenter = class EventCenter {
};
exports.EventCenter = EventCenter;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EventCenter.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventCenter.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], EventCenter.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb"),
    __metadata("design:type", Object)
], EventCenter.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { default: [] }),
    __metadata("design:type", Array)
], EventCenter.prototype, "amenities", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { nullable: true }),
    __metadata("design:type", Object)
], EventCenter.prototype, "nearbyPlaces", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { default: [] }),
    __metadata("design:type", Array)
], EventCenter.prototype, "allowedEventTypes", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { default: [] }),
    __metadata("design:type", Array)
], EventCenter.prototype, "blockedEventTypes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "flexible" }),
    __metadata("design:type", String)
], EventCenter.prototype, "cancellationPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    }),
    __metadata("design:type", String)
], EventCenter.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], EventCenter.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], EventCenter.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)("float", { default: 0 }),
    __metadata("design:type", Number)
], EventCenter.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], EventCenter.prototype, "totalReviews", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], EventCenter.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], EventCenter.prototype, "featureVideoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], EventCenter.prototype, "featureVideoPublicId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "hostId" }),
    __metadata("design:type", User_1.User)
], EventCenter.prototype, "host", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventCenter.prototype, "hostId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EventSpace_1.EventSpace, (space) => space.eventCenter, { cascade: true }),
    __metadata("design:type", Array)
], EventCenter.prototype, "spaces", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EventCenterImage_1.EventCenterImage, (image) => image.eventCenter, { cascade: true }),
    __metadata("design:type", Array)
], EventCenter.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EventCenter.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EventCenter.prototype, "updatedAt", void 0);
exports.EventCenter = EventCenter = __decorate([
    (0, typeorm_1.Entity)("event_centers")
], EventCenter);
//# sourceMappingURL=EventCenter.js.map