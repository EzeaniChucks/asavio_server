// src/app.ts
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppDataSource } from "./config/database";
import { initSocket } from "./socket";
import { autoSeed } from "./scripts/seed";
import { startBookingLifecycleJob } from "./jobs/bookingLifecycleJob";
import authRouter from "./routers/authRouter";
import propertyRouter from "./routers/propertyRouter";
import bookingRouter from "./routers/bookingRouter";
import vehicleRouter from "./routers/vehicleRouter";
import adminRouter from "./routers/adminRouter";
import reviewRouter from "./routers/reviewRouter";
import paymentRouter from "./routers/paymentRouter";
import payoutRouter from "./routers/payoutRouter";
import kycRouter from "./routers/kycRouter";
import conversationRouter from "./routers/conversationRouter";
import notificationRouter from "./routers/notificationRouter";
import savedItemRouter from "./routers/savedItemRouter";
import { errorHandler } from "./middleware/errorHandler";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Trust the first proxy hop (required on Render/Heroku so that
// express-rate-limit and req.ip work correctly with X-Forwarded-For)
app.set("trust proxy", 1);

// CORS must come BEFORE helmet so preflight OPTIONS responses include the right headers
const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin (no Origin header) and any explicitly allowed origin
    const allowed = (process.env.FRONTEND_URL || "http://localhost:3000")
      .split(",")
      .map((o) => o.trim().replace(/\/$/, ""));
    const normalised = origin?.replace(/\/$/, "");

    // console.log("normalised", normalised)
    
    if (!normalised || allowed.includes(normalised)) return callback(null, true);
    console.warn(`[CORS] blocked origin: ${origin}`);
    callback(null, false); // return false (not an Error) so the response is a clean 200 without CORS headers
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

// Rate limiting — strict on auth, permissive on general API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,                   // 20 attempts per IP
  message: { status: "error", message: "Too many attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);

// Body parser — capture rawBody for Paystack webhook HMAC verification
app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/properties", propertyRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/vehicles", vehicleRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/payouts", payoutRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/conversations", conversationRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/saved", savedItemRouter);

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
    await autoSeed(AppDataSource);

    // Attach Socket.io to the shared HTTP server
    initSocket(httpServer);

    // Background jobs
    startBookingLifecycleJob();

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
  });

export default app;
