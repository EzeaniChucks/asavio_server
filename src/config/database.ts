// src/config/database.ts
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { Booking } from "../entities/Booking";
import { Vehicle } from "../entities/Vehicle";
import { Review } from "../entities/Review";
import { Image } from "../entities/Image";
import { PlatformSettings } from "../entities/PlatformSettings";
import { Conversation } from "../entities/Conversation";
import { Message } from "../entities/Message";
import { Notification } from "../entities/Notification";
import { SavedItem } from "../entities/SavedItem";
import { RevokedToken } from "../entities/RevokedToken";
import { AdminAuditLog } from "../entities/AdminAuditLog";
import { Subscription } from "../entities/Subscription";
import { SupportTicket } from "../entities/SupportTicket";
import { Hotel } from "../entities/Hotel";
import { RoomType } from "../entities/RoomType";
import { HotelImage } from "../entities/HotelImage";
import { RoomTypeImage } from "../entities/RoomTypeImage";
import { EventCenter } from "../entities/EventCenter";
import { EventSpace } from "../entities/EventSpace";
import { EventBooking } from "../entities/EventBooking";
import { EventCenterImage } from "../entities/EventCenterImage";
import { EventSpaceImage } from "../entities/EventSpaceImage";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  url:
    process.env.DATABASE_URL ||
    "postgres://asavio:Certifyme_2*@localhost:5432/asavio_db",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_DATABASE || "asavio",
  // synchronize: process.env.NODE_ENV !== "production", // auto-create tables in dev
  synchronize: false, // please leave this as false, even in production
  // logging: process.env.NODE_ENV === "development",
  entities: [User, Property, Booking, Vehicle, Review, Image, PlatformSettings, Conversation, Message, Notification, SavedItem, RevokedToken, AdminAuditLog, Subscription, SupportTicket, Hotel, RoomType, HotelImage, RoomTypeImage, EventCenter, EventSpace, EventBooking, EventCenterImage, EventSpaceImage],
  migrations: [__dirname + "/../migrations/*{.ts,.js}"],
});
