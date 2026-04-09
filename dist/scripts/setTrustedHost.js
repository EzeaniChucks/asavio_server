"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/setTrustedHost.ts
//
// Directly sets hostTier = 'trusted_host' for a user by name.
// Safe to re-run — idempotent.
//
// Run with:  npx ts-node src/scripts/setTrustedHost.ts
//
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../entities/User");
const Property_1 = require("../entities/Property");
const Image_1 = require("../entities/Image");
const Vehicle_1 = require("../entities/Vehicle");
const Booking_1 = require("../entities/Booking");
const Review_1 = require("../entities/Review");
const Conversation_1 = require("../entities/Conversation");
const Message_1 = require("../entities/Message");
dotenv_1.default.config();
const ds = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL ||
        `postgres://${process.env.DB_USERNAME || "postgres"}:${process.env.DB_PASSWORD || "password"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_DATABASE || "asavio"}`,
    synchronize: false,
    logging: false,
    entities: [User_1.User, Property_1.Property, Image_1.Image, Vehicle_1.Vehicle, Booking_1.Booking, Review_1.Review, Conversation_1.Conversation, Message_1.Message],
});
// ── hosts to promote ─────────────────────────────────────────────────────────
const TRUSTED_HOSTS = [
    { firstName: "Alakinde", lastName: "Boluwatife" },
];
async function main() {
    console.log("🔗 Connecting to database…");
    await ds.initialize();
    console.log("✓ Connected\n");
    const userRepo = ds.getRepository(User_1.User);
    for (const { firstName, lastName } of TRUSTED_HOSTS) {
        const user = await userRepo.findOne({
            where: { firstName, lastName },
        });
        if (!user) {
            console.warn(`⚠️  User not found: ${firstName} ${lastName}`);
            continue;
        }
        if (user.hostTier === "trusted_host") {
            console.log(`ℹ️  ${firstName} ${lastName} is already a trusted_host — skipping.`);
            continue;
        }
        await userRepo.update(user.id, { hostTier: "trusted_host" });
        console.log(`✅  ${firstName} ${lastName} (${user.email}) → trusted_host`);
    }
    await ds.destroy();
    console.log("\nDone.");
}
main().catch((err) => {
    console.error("❌ setTrustedHost failed:", err.message);
    process.exit(1);
});
//# sourceMappingURL=setTrustedHost.js.map