"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const database_1 = require("./config/database");
const socket_1 = require("./socket");
const seed_1 = require("./scripts/seed");
const authRouter_1 = __importDefault(require("./routers/authRouter"));
const propertyRouter_1 = __importDefault(require("./routers/propertyRouter"));
const bookingRouter_1 = __importDefault(require("./routers/bookingRouter"));
const vehicleRouter_1 = __importDefault(require("./routers/vehicleRouter"));
const adminRouter_1 = __importDefault(require("./routers/adminRouter"));
const reviewRouter_1 = __importDefault(require("./routers/reviewRouter"));
const paymentRouter_1 = __importDefault(require("./routers/paymentRouter"));
const payoutRouter_1 = __importDefault(require("./routers/payoutRouter"));
const kycRouter_1 = __importDefault(require("./routers/kycRouter"));
const conversationRouter_1 = __importDefault(require("./routers/conversationRouter"));
const notificationRouter_1 = __importDefault(require("./routers/notificationRouter"));
const savedItemRouter_1 = __importDefault(require("./routers/savedItemRouter"));
const errorHandler_1 = require("./middleware/errorHandler");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = http_1.default.createServer(app);
const PORT = process.env.PORT || 5000;
// Trust the first proxy hop (required on Render/Heroku so that
// express-rate-limit and req.ip work correctly with X-Forwarded-For)
app.set("trust proxy", 1);
// CORS must come BEFORE helmet so preflight OPTIONS responses include the right headers
const corsOptions = {
    origin: (origin, callback) => {
        // Allow same-origin (no Origin header) and any explicitly allowed origin
        const allowed = (process.env.FRONTEND_URL || "http://localhost:3000")
            .split(",")
            .map((o) => o.trim().replace(/\/$/, ""));
        const normalised = origin?.replace(/\/$/, "");
        // console.log("normalised", normalised)
        if (!normalised || allowed.includes(normalised))
            return callback(null, true);
        console.warn(`[CORS] blocked origin: ${origin}`);
        callback(null, false); // return false (not an Error) so the response is a clean 200 without CORS headers
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
// Rate limiting — strict on auth, permissive on general API
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 20, // 20 attempts per IP
    message: { status: "error", message: "Too many attempts. Please try again later." },
});
const apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 200,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api", apiLimiter);
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
app.use("/api/kyc", kycRouter_1.default);
app.use("/api/conversations", conversationRouter_1.default);
app.use("/api/notifications", notificationRouter_1.default);
app.use("/api/saved", savedItemRouter_1.default);
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
    await (0, seed_1.autoSeed)(database_1.AppDataSource);
    // Attach Socket.io to the shared HTTP server
    (0, socket_1.initSocket)(httpServer);
    httpServer.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error("Error connecting to database:", error);
    process.exit(1);
});
exports.default = app;
//# sourceMappingURL=app.js.map