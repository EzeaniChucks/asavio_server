"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./config/database");
const seed_1 = require("./scripts/seed");
const authRouter_1 = __importDefault(require("./routers/authRouter"));
const propertyRouter_1 = __importDefault(require("./routers/propertyRouter"));
const bookingRouter_1 = __importDefault(require("./routers/bookingRouter"));
const vehicleRouter_1 = __importDefault(require("./routers/vehicleRouter"));
const adminRouter_1 = __importDefault(require("./routers/adminRouter"));
const reviewRouter_1 = __importDefault(require("./routers/reviewRouter"));
const paymentRouter_1 = __importDefault(require("./routers/paymentRouter"));
const payoutRouter_1 = __importDefault(require("./routers/payoutRouter"));
const errorHandler_1 = require("./middleware/errorHandler");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// CORS must come BEFORE helmet so preflight OPTIONS responses include the right headers
const corsOptions = {
    origin: (origin, callback) => {
        // Allow same-origin (no Origin header) and any explicitly allowed origin
        const allowed = (process.env.FRONTEND_URL || "http://localhost:3000")
            .split(",")
            .map((o) => o.trim());
        if (!origin || allowed.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
// Handle preflight for all routes (Express 5 requires named wildcard)
app.options("/{*path}", (0, cors_1.default)(corsOptions));
app.use((0, cors_1.default)(corsOptions));
// Helmet AFTER CORS — disable crossOriginResourcePolicy so browser cross-origin fetches work
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: false,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
});
app.use("/api", limiter);
// Body parser — capture rawBody for Paystack webhook HMAC verification
app.use(express_1.default.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
        req.rawBody = buf;
    },
}));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Routes
app.use("/api/auth", authRouter_1.default);
app.use("/api/properties", propertyRouter_1.default);
app.use("/api/bookings", bookingRouter_1.default);
app.use("/api/vehicles", vehicleRouter_1.default);
app.use("/api/reviews", reviewRouter_1.default);
app.use("/api/admin", adminRouter_1.default);
app.use("/api/payments", paymentRouter_1.default);
app.use("/api/payouts", payoutRouter_1.default);
// Health check
app.get("/health", (_req, res) => {
    res.status(200).json({ status: "OK", message: "Server is running" });
});
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// Database connection and server start
database_1.AppDataSource.initialize()
    .then(async () => {
    console.log("Database connected successfully");
    // Run pending migrations in production (synchronize is off)
    // if (process.env.NODE_ENV === "production") {
    //   const pending = await AppDataSource.showMigrations();
    //   if (pending) {
    //     console.log("Running pending migrations…");
    //     await AppDataSource.runMigrations();
    //     console.log("Migrations complete");
    //   }
    // }
    await (0, seed_1.autoSeed)(database_1.AppDataSource);
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map