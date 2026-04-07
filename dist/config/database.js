"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
// src/config/database.ts
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Property_1 = require("../entities/Property");
const Booking_1 = require("../entities/Booking");
const Vehicle_1 = require("../entities/Vehicle");
const Review_1 = require("../entities/Review");
const Image_1 = require("../entities/Image");
const PlatformSettings_1 = require("../entities/PlatformSettings");
const Conversation_1 = require("../entities/Conversation");
const Message_1 = require("../entities/Message");
const Notification_1 = require("../entities/Notification");
const SavedItem_1 = require("../entities/SavedItem");
const RevokedToken_1 = require("../entities/RevokedToken");
const AdminAuditLog_1 = require("../entities/AdminAuditLog");
const Subscription_1 = require("../entities/Subscription");
const SupportTicket_1 = require("../entities/SupportTicket");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL ||
        "postgres://asavio:Certifyme_2*@localhost:5432/asavio_db",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_DATABASE || "asavio",
    // synchronize: process.env.NODE_ENV !== "production", // auto-create tables in dev
    synchronize: false, // please leave this as false, even in production
    // logging: process.env.NODE_ENV === "development",
    entities: [User_1.User, Property_1.Property, Booking_1.Booking, Vehicle_1.Vehicle, Review_1.Review, Image_1.Image, PlatformSettings_1.PlatformSettings, Conversation_1.Conversation, Message_1.Message, Notification_1.Notification, SavedItem_1.SavedItem, RevokedToken_1.RevokedToken, AdminAuditLog_1.AdminAuditLog, Subscription_1.Subscription, SupportTicket_1.SupportTicket],
    migrations: [__dirname + "/../migrations/*{.ts,.js}"],
});
//# sourceMappingURL=database.js.map