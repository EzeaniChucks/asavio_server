// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./config/database";
import { autoSeed } from "./scripts/seed";
import authRouter from "./routers/authRouter";
import propertyRouter from "./routers/propertyRouter";
import bookingRouter from "./routers/bookingRouter";
import vehicleRouter from "./routers/vehicleRouter";
import adminRouter from "./routers/adminRouter";
import reviewRouter from "./routers/reviewRouter";
import { errorHandler } from "./middleware/errorHandler";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS must come BEFORE helmet so preflight OPTIONS responses include the right headers
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin (no Origin header) and any explicitly allowed origin
    const allowed = (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((o) => o.trim());
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Handle preflight for all routes (Express 5 requires named wildcard)
app.options("/{*path}", cors(corsOptions));
app.use(cors(corsOptions));

// Helmet AFTER CORS — disable crossOriginResourcePolicy so browser cross-origin fetches work
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRouter);

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use(errorHandler);

// Database connection and server start
AppDataSource.initialize()
  .then(async () => {
    console.log("Database connected successfully");

    // Run pending migrations in production (synchronize is off)
    if (process.env.NODE_ENV === "production") {
      const pending = await AppDataSource.showMigrations();
      if (pending) {
        console.log("Running pending migrations…");
        await AppDataSource.runMigrations();
        console.log("Migrations complete");
      }
    }

    await autoSeed(AppDataSource);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });

export default app;
