// src/config/database.ts
import { DataSource } from "typeorm";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { Booking } from "../entities/Booking";
import { Vehicle } from "../entities/Vehicle";
import { Review } from "../entities/Review";
import { Image } from "../entities/Image";
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
  entities: [User, Property, Booking, Vehicle, Review, Image],
  migrations: [__dirname + "/../migrations/*.js"],
});
