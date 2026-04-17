"use strict";
// src/entities/HotelImage.ts
// Hotel-wide photos (lobby, exterior, common amenities)
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
exports.HotelImage = void 0;
const typeorm_1 = require("typeorm");
const Hotel_1 = require("./Hotel");
let HotelImage = class HotelImage {
};
exports.HotelImage = HotelImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], HotelImage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HotelImage.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HotelImage.prototype, "publicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], HotelImage.prototype, "altText", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], HotelImage.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Hotel_1.Hotel, (hotel) => hotel.images, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "hotelId" }),
    __metadata("design:type", Hotel_1.Hotel)
], HotelImage.prototype, "hotel", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HotelImage.prototype, "hotelId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HotelImage.prototype, "createdAt", void 0);
exports.HotelImage = HotelImage = __decorate([
    (0, typeorm_1.Entity)("hotel_images")
], HotelImage);
//# sourceMappingURL=HotelImage.js.map