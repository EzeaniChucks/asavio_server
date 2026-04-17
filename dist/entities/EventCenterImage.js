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
exports.EventCenterImage = void 0;
// src/entities/EventCenterImage.ts
const typeorm_1 = require("typeorm");
const EventCenter_1 = require("./EventCenter");
let EventCenterImage = class EventCenterImage {
};
exports.EventCenterImage = EventCenterImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EventCenterImage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventCenterImage.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventCenterImage.prototype, "publicId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EventCenterImage.prototype, "altText", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], EventCenterImage.prototype, "isPrimary", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => EventCenter_1.EventCenter, (ec) => ec.images, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "eventCenterId" }),
    __metadata("design:type", EventCenter_1.EventCenter)
], EventCenterImage.prototype, "eventCenter", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventCenterImage.prototype, "eventCenterId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EventCenterImage.prototype, "createdAt", void 0);
exports.EventCenterImage = EventCenterImage = __decorate([
    (0, typeorm_1.Entity)("event_center_images")
], EventCenterImage);
//# sourceMappingURL=EventCenterImage.js.map