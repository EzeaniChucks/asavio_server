"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/seedReviews.ts
// Run with: npm run seed:reviews
// Adds real review rows to existing seeded properties and recomputes
// averageRating / totalReviews so card counts match the detail page.
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
const Hotel_1 = require("../entities/Hotel");
const RoomType_1 = require("../entities/RoomType");
const HotelImage_1 = require("../entities/HotelImage");
const RoomTypeImage_1 = require("../entities/RoomTypeImage");
const EventCenter_1 = require("../entities/EventCenter");
const EventSpace_1 = require("../entities/EventSpace");
const EventBooking_1 = require("../entities/EventBooking");
const EventCenterImage_1 = require("../entities/EventCenterImage");
const EventSpaceImage_1 = require("../entities/EventSpaceImage");
dotenv_1.default.config();
const ds = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL ||
        `postgres://${process.env.DB_USERNAME || "postgres"}:${process.env.DB_PASSWORD || "password"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_DATABASE || "asavio"}`,
    synchronize: false,
    logging: false,
    entities: [User_1.User, Property_1.Property, Image_1.Image, Vehicle_1.Vehicle, Booking_1.Booking, Review_1.Review, Hotel_1.Hotel, RoomType_1.RoomType, HotelImage_1.HotelImage, RoomTypeImage_1.RoomTypeImage, EventCenter_1.EventCenter, EventSpace_1.EventSpace, EventBooking_1.EventBooking, EventCenterImage_1.EventCenterImage, EventSpaceImage_1.EventSpaceImage],
});
const REVIEW_POOL = [
    { rating: 5, comment: "Absolutely stunning property. Every detail was thoughtfully considered — from the plush bedding to the fully stocked kitchen. We felt like royalty. Will definitely return." },
    { rating: 5, comment: "One of the best stays I've ever had. The host was incredibly responsive and the property exceeded our expectations in every single way. A true luxury experience." },
    { rating: 5, comment: "The views alone were worth every kobo. Woke up every morning feeling grateful. The space is even more impressive in person than the photos suggest." },
    { rating: 5, comment: "Exceptional value. We've stayed in 5-star hotels that didn't compare to the comfort and style on offer here. Truly world-class." },
    { rating: 5, comment: "A hidden gem. The photos don't do it justice — the property is even more beautiful in person. Generous space and premium finishes throughout." },
    { rating: 4, comment: "Perfect for our family getaway. The kids loved the pool and we loved the peace and quiet. Location was ideal for exploring the city. Highly recommended." },
    { rating: 4, comment: "Beautifully decorated and spotlessly clean. The neighbourhood feels safe and all the amenities were exactly as described. Would book again." },
    { rating: 4, comment: "Highly recommended for business travellers. Fast Wi-Fi, a proper workspace, and a surprisingly peaceful setting despite being so central." },
    { rating: 4, comment: "Smooth check-in and the property was exactly as described. Clean, comfortable, and very well-equipped. The host communicated brilliantly throughout." },
    { rating: 4, comment: "We hosted a small family reunion here and it was perfect. Plenty of space, great amenities, and a superb location that impressed everyone." },
    { rating: 4, comment: "The attention to detail is remarkable. Premium finishes, comfortable furniture, and a great location. Arrived tired and left completely rejuvenated." },
    { rating: 3, comment: "Nice property overall and in a great location. A few minor things could be improved but the host was responsive and sorted them out quickly." },
];
const REVIEWER_PERSONAS = [
    { firstName: "Tunde", lastName: "Adeyemi", email: "tunde.adeyemi@example.com" },
    { firstName: "Ngozi", lastName: "Obi", email: "ngozi.obi@example.com" },
    { firstName: "Emeka", lastName: "Eze", email: "emeka.eze@example.com" },
    { firstName: "Fatima", lastName: "Yusuf", email: "fatima.yusuf@example.com" },
    { firstName: "Chukwu", lastName: "Nwankwo", email: "chukwu.nwankwo@example.com" },
];
const REVIEWS_PER_PROPERTY = [5, 4, 3, 5, 4, 3, 4, 3];
async function main() {
    console.log("🌱 Connecting to database…");
    await ds.initialize();
    console.log("✓ Connected\n");
    const userRepo = ds.getRepository(User_1.User);
    const propertyRepo = ds.getRepository(Property_1.Property);
    const reviewRepo = ds.getRepository(Review_1.Review);
    // Ensure reviewer users exist
    const reviewers = [];
    for (const persona of REVIEWER_PERSONAS) {
        let reviewer = await userRepo.findOne({ where: { email: persona.email } });
        if (!reviewer) {
            reviewer = userRepo.create({
                ...persona,
                password: await bcryptjs_1.default.hash("Reviewer123!", 10),
                role: "user",
                isVerified: true,
            });
            await userRepo.save(reviewer);
            console.log(`  ✓ Created reviewer: ${persona.email}`);
        }
        reviewers.push(reviewer);
    }
    const properties = await propertyRepo.find();
    console.log(`\n⭐ Processing ${properties.length} properties…\n`);
    for (let pi = 0; pi < properties.length; pi++) {
        const prop = properties[pi];
        // Check how many real reviews already exist
        const existingReviews = await reviewRepo.find({ where: { propertyId: prop.id } });
        if (existingReviews.length > 0) {
            console.log(`  — ${prop.title}: ${existingReviews.length} reviews already exist, skipping`);
            // Still ensure the computed columns are accurate
            const avg = existingReviews.reduce((s, r) => s + r.rating, 0) / existingReviews.length;
            await propertyRepo.update(prop.id, {
                totalReviews: existingReviews.length,
                averageRating: Math.round(avg * 10) / 10,
            });
            continue;
        }
        // Reset any stale hardcoded counts first
        await propertyRepo.update(prop.id, { totalReviews: 0, averageRating: 0 });
        const count = REVIEWS_PER_PROPERTY[pi % REVIEWS_PER_PROPERTY.length];
        const pickedReviewers = [...reviewers].sort(() => Math.random() - 0.5).slice(0, count);
        const pickedContent = [...REVIEW_POOL].sort(() => Math.random() - 0.5).slice(0, count);
        for (let ri = 0; ri < count; ri++) {
            const review = reviewRepo.create({
                propertyId: prop.id,
                userId: pickedReviewers[ri].id,
                rating: pickedContent[ri].rating,
                comment: pickedContent[ri].comment,
            });
            await reviewRepo.save(review);
        }
        // Recompute from actual rows
        const newReviews = await reviewRepo.find({ where: { propertyId: prop.id } });
        const avg = newReviews.reduce((s, r) => s + r.rating, 0) / newReviews.length;
        await propertyRepo.update(prop.id, {
            totalReviews: newReviews.length,
            averageRating: Math.round(avg * 10) / 10,
        });
        console.log(`  ✓ ${count} reviews added → ${prop.title} (avg: ${(Math.round(avg * 10) / 10).toFixed(1)})`);
    }
    console.log("\n✅ Reviews seeded successfully!\n");
    await ds.destroy();
}
main().catch((err) => {
    console.error("❌ seedReviews failed:", err.message);
    process.exit(1);
});
//# sourceMappingURL=seedReviews.js.map