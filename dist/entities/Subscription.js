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
exports.Subscription = void 0;
// src/entities/Subscription.ts
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let Subscription = class Subscription {
};
exports.Subscription = Subscription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Subscription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Subscription.prototype, "hostId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "hostId" }),
    __metadata("design:type", User_1.User)
], Subscription.prototype, "host", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["starter", "pro", "elite"],
        default: "starter",
    }),
    __metadata("design:type", String)
], Subscription.prototype, "tier", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["monthly", "annual"],
        default: "monthly",
    }),
    __metadata("design:type", String)
], Subscription.prototype, "billingCycle", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ["active", "cancelled", "expired", "past_due"],
        default: "active",
    }),
    __metadata("design:type", String)
], Subscription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "paystackSubscriptionCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "paystackCustomerCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "paystackPlanCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "paystackEmailToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Subscription.prototype, "currentPeriodStart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz" }),
    __metadata("design:type", Date)
], Subscription.prototype, "currentPeriodEnd", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamptz", nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", Object)
], Subscription.prototype, "cancellationReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Subscription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Subscription.prototype, "updatedAt", void 0);
exports.Subscription = Subscription = __decorate([
    (0, typeorm_1.Entity)("subscriptions")
], Subscription);
//# sourceMappingURL=Subscription.js.map