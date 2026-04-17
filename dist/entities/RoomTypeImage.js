"use strict";
// src/entities/RoomTypeImage.ts
// Per-room-type photos (one set of representative shots per room type)
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
exports.RoomTypeImage = void 0;
const typeorm_1 = require("typeorm");
const RoomType_1 = require("./RoomType");
let RoomTypeImage = class RoomTypeImage {
};
exports.RoomTypeImage = RoomTypeImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RoomTypeImage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomTypeImage.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomTypeImage.prototype, "publicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RoomTypeImage.prototype, "altText", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RoomTypeImage.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => RoomType_1.RoomType, (roomType) => roomType.images, {
        onDelete: "CASCADE",
    }),
    (0, typeorm_1.JoinColumn)({ name: "roomTypeId" }),
    __metadata("design:type", RoomType_1.RoomType)
], RoomTypeImage.prototype, "roomType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RoomTypeImage.prototype, "roomTypeId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RoomTypeImage.prototype, "createdAt", void 0);
exports.RoomTypeImage = RoomTypeImage = __decorate([
    (0, typeorm_1.Entity)("room_type_images")
], RoomTypeImage);
//# sourceMappingURL=RoomTypeImage.js.map