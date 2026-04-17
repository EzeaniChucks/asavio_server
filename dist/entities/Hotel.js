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
exports.Hotel = void 0;
// src/entities/Hotel.ts
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const RoomType_1 = require("./RoomType");
const HotelImage_1 = require("./HotelImage");
let Hotel = class Hotel {
};
exports.Hotel = Hotel;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Hotel.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hotel.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("text"),
    __metadata("design:type", String)
], Hotel.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "Hotel" }),
    __metadata("design:type", String)
], Hotel.prototype, "hotelType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", nullable: true }),
    __metadata("design:type", Object)
], Hotel.prototype, "starRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Hotel.prototype, "verifiedStarRating", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb"),
    __metadata("design:type", Object)
], Hotel.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { default: [] }),
    __metadata("design:type", Array)
], Hotel.prototype, "amenities", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { nullable: true }),
    __metadata("design:type", Object)
], Hotel.prototype, "nearbyPlaces", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5, default: "14:00" }),
    __metadata("design:type", String)
], Hotel.prototype, "checkInTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 5, default: "11:00" }),
    __metadata("design:type", String)
], Hotel.prototype, "checkOutTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "flexible" }),
    __metadata("design:type", String)
], Hotel.prototype, "cancellationPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Hotel.prototype, "checkInInstructions", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["pending", "approved", "rejected"],
        default: "pending",
    }),
    __metadata("design:type", String)
], Hotel.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Hotel.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Hotel.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)("float", { default: 0 }),
    __metadata("design:type", Number)
], Hotel.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Hotel.prototype, "totalReviews", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Hotel.prototype, "viewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Hotel.prototype, "featureVideoUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Hotel.prototype, "featureVideoPublicId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "hostId" }),
    __metadata("design:type", User_1.User)
], Hotel.prototype, "host", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Hotel.prototype, "hostId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RoomType_1.RoomType, (room) => room.hotel, { cascade: true }),
    __metadata("design:type", Array)
], Hotel.prototype, "roomTypes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => HotelImage_1.HotelImage, (image) => image.hotel, { cascade: true }),
    __metadata("design:type", Array)
], Hotel.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Hotel.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Hotel.prototype, "updatedAt", void 0);
exports.Hotel = Hotel = __decorate([
    (0, typeorm_1.Entity)("hotels")
], Hotel);
//# sourceMappingURL=Hotel.js.map