"use strict";
// src/entities/RoomType.ts
// A room TYPE (e.g. "Deluxe King") with a pool of interchangeable units.
// A booking draws `quantity` units from the pool — guests don't pick a specific room number.
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
exports.RoomType = void 0;
const typeorm_1 = require("typeorm");
const Hotel_1 = require("./Hotel");
const RoomTypeImage_1 = require("./RoomTypeImage");
let RoomType = class RoomType {
};
exports.RoomType = RoomType;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RoomType.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomType.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)("text", { nullable: true }),
    __metadata("design:type", Object)
], RoomType.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], RoomType.prototype, "pricePerNight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint" }),
    __metadata("design:type", Number)
], RoomType.prototype, "maxGuests", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "smallint", default: 1 }),
    __metadata("design:type", Number)
], RoomType.prototype, "totalUnits", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RoomType.prototype, "bedType", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RoomType.prototype, "roomSize", void 0);
__decorate([
    (0, typeorm_1.Column)("jsonb", { default: [] }),
    __metadata("design:type", Array)
], RoomType.prototype, "roomAmenities", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], RoomType.prototype, "cautionFee", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Hotel_1.Hotel, (hotel) => hotel.roomTypes, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "hotelId" }),
    __metadata("design:type", Hotel_1.Hotel)
], RoomType.prototype, "hotel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomType.prototype, "hotelId", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => RoomTypeImage_1.RoomTypeImage, (image) => image.roomType, { cascade: true }),
    __metadata("design:type", Array)
], RoomType.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RoomType.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RoomType.prototype, "updatedAt", void 0);
exports.RoomType = RoomType = __decorate([
    (0, typeorm_1.Entity)("room_types")
], RoomType);
//# sourceMappingURL=RoomType.js.map