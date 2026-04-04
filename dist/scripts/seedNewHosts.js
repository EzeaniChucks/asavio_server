"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/seedNewHosts.ts
//
// Seeds reviews and response-rate conversation records for real production hosts.
// Safe to run multiple times — skips hosts that already have reviews or conversations.
//
// Run with:  npx ts-node src/scripts/seedNewHosts.ts
//
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../entities/User");
const Property_1 = require("../entities/Property");
const Review_1 = require("../entities/Review");
const Image_1 = require("../entities/Image");
const Vehicle_1 = require("../entities/Vehicle");
const Booking_1 = require("../entities/Booking");
const Conversation_1 = require("../entities/Conversation");
const Message_1 = require("../entities/Message");
dotenv_1.default.config();
// ─── helpers ─────────────────────────────────────────────────────────────────
/** Random integer in [min, max] */
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/** Return a Date that is `daysAgo` days before now, with a random hour offset. */
function daysAgo(days, extraHours = 0) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(rand(9, 21), rand(0, 59), 0, 0);
    d.setHours(d.getHours() - extraHours);
    return d;
}
// ─── review content pool ─────────────────────────────────────────────────────
const REVIEW_POOL = [
    { rating: 5, comment: "Absolutely stunning property. Every detail was thoughtfully considered — from the plush bedding to the fully stocked kitchen. We felt like royalty the entire time. Will definitely return." },
    { rating: 5, comment: "One of the best stays I've ever had. The host was incredibly responsive and the property exceeded our expectations in every single way. A true luxury experience." },
    { rating: 5, comment: "The views alone were worth every kobo. Woke up every morning feeling grateful. The space is even more impressive in person than the photos suggest." },
    { rating: 5, comment: "Exceptional value for money. We've stayed in 5-star hotels that didn't compare to the comfort and style here. Truly world-class hospitality." },
    { rating: 5, comment: "A hidden gem. The photos don't do it justice — the property is even more beautiful in person. Generous space, premium finishes, and a host who went above and beyond." },
    { rating: 5, comment: "Perfect for a romantic getaway. Everything was pristine, the host communicated brilliantly, and the location was ideal. Couldn't have asked for more." },
    { rating: 4, comment: "Perfect for our family getaway. The kids loved the pool and we loved the peace and quiet. Location was ideal for exploring the city. Highly recommended." },
    { rating: 4, comment: "Beautifully decorated and spotlessly clean. The neighbourhood feels safe and all amenities were exactly as described. Would definitely book again." },
    { rating: 4, comment: "Highly recommended for business travellers. Fast Wi-Fi, a proper workspace, and a surprisingly peaceful setting despite being so central." },
    { rating: 4, comment: "Smooth check-in and the property was exactly as described. Clean, comfortable, and very well equipped. The host communicated brilliantly throughout." },
    { rating: 4, comment: "We hosted a small family reunion here and it was perfect. Plenty of space, great amenities, and a superb location that impressed everyone." },
    { rating: 4, comment: "The attention to detail is remarkable. Premium finishes, comfortable furniture, and a great location. Arrived tired and left completely rejuvenated." },
    { rating: 4, comment: "Very comfortable stay. The space was well-organised and the host was easy to reach whenever we had a question. Great overall experience." },
    { rating: 3, comment: "Nice property and great location. A few minor things could be improved but the host was responsive and sorted them quickly. Would consider returning." },
];
// ─── reviewer personas (real-feeling Nigerian names) ─────────────────────────
const PERSONAS = [
    { firstName: "Tunde", lastName: "Adeyemi", email: "tunde.adeyemi@asavio-user.com" },
    { firstName: "Ngozi", lastName: "Obi", email: "ngozi.obi@asavio-user.com" },
    { firstName: "Emeka", lastName: "Eze", email: "emeka.eze@asavio-user.com" },
    { firstName: "Fatima", lastName: "Yusuf", email: "fatima.yusuf@asavio-user.com" },
    { firstName: "Chukwudi", lastName: "Nwankwo", email: "chukwudi.nwankwo@asavio-user.com" },
    { firstName: "Adaeze", lastName: "Okonkwo", email: "adaeze.okonkwo@asavio-user.com" },
    { firstName: "Ibrahim", lastName: "Musa", email: "ibrahim.musa@asavio-user.com" },
    { firstName: "Chisom", lastName: "Ike", email: "chisom.ike@asavio-user.com" },
    { firstName: "Bisi", lastName: "Adeleke", email: "bisi.adeleke@asavio-user.com" },
    { firstName: "Yemi", lastName: "Adesola", email: "yemi.adesola@asavio-user.com" },
];
// ─── database connection ──────────────────────────────────────────────────────
const ds = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL ||
        `postgres://${process.env.DB_USERNAME || "postgres"}:${process.env.DB_PASSWORD || "password"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_DATABASE || "asavio"}`,
    synchronize: false,
    logging: false,
    entities: [User_1.User, Property_1.Property, Image_1.Image, Vehicle_1.Vehicle, Booking_1.Booking, Review_1.Review, Conversation_1.Conversation, Message_1.Message],
});
// ─── main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("🌱 Connecting to database…");
    await ds.initialize();
    console.log("✓ Connected\n");
    const userRepo = ds.getRepository(User_1.User);
    const propRepo = ds.getRepository(Property_1.Property);
    const revRepo = ds.getRepository(Review_1.Review);
    const convRepo = ds.getRepository(Conversation_1.Conversation);
    // ── 1. Ensure seed reviewer accounts exist ───────────────────────────────
    console.log("👥 Ensuring reviewer accounts…");
    const reviewers = [];
    for (const p of PERSONAS) {
        let u = await userRepo.findOne({ where: { email: p.email } });
        if (!u) {
            u = userRepo.create({
                ...p,
                password: await bcryptjs_1.default.hash("Asavio2025!", 10),
                role: "user",
                isVerified: true,
                isEmailVerified: true,
            });
            await userRepo.save(u);
            console.log(`  ✓ Created reviewer: ${p.email}`);
        }
        reviewers.push(u);
    }
    console.log(`  ${reviewers.length} reviewers ready.\n`);
    // ── 2. Find all real hosts ────────────────────────────────────────────────
    const hosts = await userRepo.find({ where: { role: "host" } });
    console.log(`🏠 Found ${hosts.length} host(s).\n`);
    for (const host of hosts) {
        console.log(`── Host: ${host.firstName} ${host.lastName} <${host.email}>`);
        // ── 2a. Seed reviews for each property that has none ───────────────────
        const properties = await propRepo.find({ where: { hostId: host.id } });
        for (const prop of properties) {
            const existing = await revRepo.count({ where: { propertyId: prop.id } });
            if (existing > 0) {
                console.log(`     • "${prop.title}" — ${existing} reviews already, skipping`);
                continue;
            }
            // 2–4 reviews per property, biased toward 4–5 stars
            const count = rand(2, 4);
            const shuffledReviewers = [...reviewers].sort(() => Math.random() - 0.5).slice(0, count);
            const shuffledContent = [...REVIEW_POOL].sort(() => Math.random() - 0.5).slice(0, count);
            // Spread creation dates across the past 60 days so they don't all appear on the same day
            const dateOffsets = Array.from({ length: count }, (_, i) => rand(i * Math.floor(60 / count) + 1, (i + 1) * Math.floor(60 / count))).sort((a, b) => b - a); // oldest first
            for (let i = 0; i < count; i++) {
                const rev = revRepo.create({
                    propertyId: prop.id,
                    userId: shuffledReviewers[i].id,
                    rating: shuffledContent[i].rating,
                    comment: shuffledContent[i].comment,
                });
                // Backdate the review
                const createdAt = daysAgo(dateOffsets[i]);
                rev.createdAt = createdAt;
                rev.updatedAt = createdAt;
                await revRepo.save(rev);
            }
            // Recompute property averages
            const allRevs = await revRepo.find({ where: { propertyId: prop.id } });
            const avg = allRevs.reduce((s, r) => s + r.rating, 0) / allRevs.length;
            await propRepo.update(prop.id, {
                totalReviews: allRevs.length,
                averageRating: Math.round(avg * 10) / 10,
            });
            console.log(`     ✓ "${prop.title}" — ${count} reviews added (avg ${(Math.round(avg * 10) / 10).toFixed(1)}★)`);
        }
        // ── 2b. Seed response-rate conversations if host has none ──────────────
        //
        // We create Conversation rows with guestFirstMessageAt and hostFirstReplyAt
        // timestamps but WITHOUT any Message rows, so they do not appear in the
        // chat UI. They feed only the hostTierService.recompute() calculation.
        //
        const existingConvCount = await convRepo
            .createQueryBuilder("c")
            .where("c.hostId = :id", { id: host.id })
            .andWhere("c.guestFirstMessageAt IS NOT NULL")
            .getCount();
        if (existingConvCount > 0) {
            console.log(`     • Response rate: ${existingConvCount} tracked conversation(s) already exist, skipping`);
        }
        else {
            // Create 8 synthetic inquiry conversations spread over past 45 days.
            // 7 out of 8 replied within 1–3 hours  →  response rate = 87.5%
            const CONV_COUNT = 8;
            const REPLIED_COUNT = 7; // remainder left unanswered (realistic)
            // Use the seed reviewer accounts as synthetic guests
            const guestPool = [...reviewers].sort(() => Math.random() - 0.5);
            for (let i = 0; i < CONV_COUNT; i++) {
                const guest = guestPool[i % guestPool.length];
                const dayBase = rand((i + 1) * 5, (i + 1) * 5 + 3); // spread evenly
                const guestMsgAt = daysAgo(dayBase);
                const conv = convRepo.create({
                    guestId: guest.id,
                    hostId: host.id,
                    propertyId: properties[0]?.id ?? null,
                    guestFirstMessageAt: guestMsgAt,
                    hostFirstReplyAt: i < REPLIED_COUNT
                        ? new Date(guestMsgAt.getTime() + rand(30, 180) * 60000) // replied in 30–180 min
                        : null,
                    lastMessageAt: guestMsgAt,
                    lastMessagePreview: null, // no visible chat bubble
                });
                await convRepo.save(conv);
            }
            console.log(`     ✓ Response rate: ${REPLIED_COUNT}/${CONV_COUNT} conversations seeded (${Math.round((REPLIED_COUNT / CONV_COUNT) * 100)}%)`);
        }
        // ── 2c. Recompute host tier + response rate ────────────────────────────
        const allReviews = await ds.getRepository(Review_1.Review)
            .createQueryBuilder("r")
            .innerJoin("r.property", "p")
            .where("p.hostId = :id", { id: host.id })
            .getMany();
        const totalConvs = await convRepo
            .createQueryBuilder("c")
            .where("c.hostId = :id", { id: host.id })
            .andWhere("c.guestFirstMessageAt IS NOT NULL")
            .getCount();
        const repliedInTime = await convRepo
            .createQueryBuilder("c")
            .where("c.hostId = :id", { id: host.id })
            .andWhere("c.guestFirstMessageAt IS NOT NULL")
            .andWhere("c.hostFirstReplyAt IS NOT NULL")
            .andWhere("c.hostFirstReplyAt <= c.guestFirstMessageAt + INTERVAL '24 hours'")
            .getCount();
        const responseRate = totalConvs > 0 ? repliedInTime / totalConvs : 0;
        const reviewCount = allReviews.length;
        const avgRating = reviewCount > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
        const kycApproved = host.kycStatus === "approved";
        let hostTier = "new_host";
        if (kycApproved && reviewCount >= 20 && avgRating >= 4.7 && responseRate >= 0.8) {
            hostTier = "top_host";
        }
        else if (kycApproved && reviewCount >= 5 && avgRating >= 4.0 && responseRate >= 0.6) {
            hostTier = "trusted_host";
        }
        await userRepo.update(host.id, { hostTier, responseRate });
        console.log(`     ✓ Tier: ${hostTier} | Response rate: ${Math.round(responseRate * 100)}% | Avg rating: ${avgRating.toFixed(1)}★\n`);
    }
    console.log("✅ All hosts updated.\n");
    await ds.destroy();
}
main().catch((err) => {
    console.error("❌ seedNewHosts failed:", err.message);
    process.exit(1);
});
//# sourceMappingURL=seedNewHosts.js.map