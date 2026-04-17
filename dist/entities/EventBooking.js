"use strict";
// src/entities/EventBooking.ts
// Separate from `bookings` because event bookings use time-slots on a single date,
// not date ranges with nights. Shares the same payment + cancellation patterns.
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
exports.EventBooking = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const EventCenter_1 = require("./EventCenter");
const EventSpace_1 = require("./EventSpace");
let EventBooking = class EventBooking {
};
exports.EventBooking = EventBooking;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EventBooking.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", User_1.User)
], EventBooking.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventBooking.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => EventCenter_1.EventCenter, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "eventCenterId" }),
    __metadata("design:type", EventCenter_1.EventCenter)
], EventBooking.prototype, "eventCenter", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventBooking.prototype, "eventCenterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => EventSpace_1.EventSpace, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "eventSpaceId" }),
    __metadata("design:type", EventSpace_1.EventSpace)
], EventBooking.prototype, "eventSpace", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventBooking.prototype, "eventSpaceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "date" }),
    __metadata("design:type", Date)
], EventBooking.prototype, "eventDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time" }),
    __metadata("design:type", String)
], EventBooking.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "time" }),
    __metadata("design:type", String)
], EventBooking.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EventBooking.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], EventBooking.prototype, "attendeeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar" }),
    __metadata("design:type", String)
], EventBooking.prototype, "pricingUsed", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], EventBooking.prototype, "totalPrice", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EventBooking.prototype, "platformCommission", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EventBooking.prototype, "hostPayout", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 5, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], EventBooking.prototype, "appliedCommissionRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: "NGN" }),
    __metadata("design:type", String)
], EventBooking.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["awaiting_payment", "confirmed", "cancelled", "completed"],
        default: "awaiting_payment",
    }),
    __metadata("design:type", String)
], EventBooking.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "paystack" }),
    __metadata("design:type", String)
], EventBooking.prototype, "paymentMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
    }),
    __metadata("design:type", String)
], EventBooking.prototype, "paymentStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EventBooking.prototype, "paystackReference", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["pending", "processing", "transferred", "failed"],
        default: "pending",
    }),
    __metadata("design:type", String)
], EventBooking.prototype, "hostPayoutStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], EventBooking.prototype, "payoutReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], EventBooking.prototype, "specialRequests", void 0);
__decorate([
    (0, typeorm_1.Column)("decimal", { precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], EventBooking.prototype, "refundedAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], EventBooking.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], EventBooking.prototype, "cancelledBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], EventBooking.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EventBooking.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EventBooking.prototype, "updatedAt", void 0);
exports.EventBooking = EventBooking = __decorate([
    (0, typeorm_1.Entity)("event_bookings")
], EventBooking);
//# sourceMappingURL=EventBooking.js.map