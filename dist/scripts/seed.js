"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSeed = runSeed;
exports.autoSeed = autoSeed;
// src/scripts/seed.ts
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../entities/User");
const Property_1 = require("../entities/Property");
const Image_1 = require("../entities/Image");
const Vehicle_1 = require("../entities/Vehicle");
const Booking_1 = require("../entities/Booking");
const Review_1 = require("../entities/Review");
dotenv_1.default.config();
// Standalone DataSource used only when running the script directly (npm run seed)
const SeedDataSource = new typeorm_1.DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL ||
        `postgres://${process.env.DB_USERNAME || "postgres"}:${process.env.DB_PASSWORD || "password"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_DATABASE || "asavio"}`,
    synchronize: true,
    logging: false,
    entities: [User_1.User, Property_1.Property, Image_1.Image, Vehicle_1.Vehicle, Booking_1.Booking, Review_1.Review],
});
// ── Unsplash image collections ────────────────────────────────────────────────
const PROPERTY_IMAGES = {
    luxury: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    ],
    apartment: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
        "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
        "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&q=80",
        "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80",
    ],
    villa: [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
        "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800&q=80",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    ],
    penthouse: [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
        "https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=800&q=80",
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    duplex: [
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80",
        "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&q=80",
        "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    ],
};
const VEHICLE_IMAGES = {
    luxury: [
        "https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=800&q=80",
        "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80",
    ],
    suv: [
        "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&q=80",
        "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80",
    ],
    sedan: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&q=80",
        "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    ],
    van: [
        "https://images.unsplash.com/photo-1614026480418-bd11fdb9fa06?w=800&q=80",
        "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&q=80",
    ],
};
// ── Review content pool ───────────────────────────────────────────────────────
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
// Reviewer personas: name, email pairs
const REVIEWER_PERSONAS = [
    { firstName: "Tunde", lastName: "Adeyemi", email: "tunde.adeyemi@example.com" },
    { firstName: "Ngozi", lastName: "Obi", email: "ngozi.obi@example.com" },
    { firstName: "Emeka", lastName: "Eze", email: "emeka.eze@example.com" },
    { firstName: "Fatima", lastName: "Yusuf", email: "fatima.yusuf@example.com" },
    { firstName: "Chukwu", lastName: "Nwankwo", email: "chukwu.nwankwo@example.com" },
];
// How many reviews each property index gets (wraps around)
const REVIEWS_PER_PROPERTY = [5, 4, 3, 5, 4, 3, 4, 3];
// How many reviews each vehicle index gets (wraps around)
const REVIEWS_PER_VEHICLE = [4, 3, 5, 3, 4];
// Vehicle-specific review pool
const VEHICLE_REVIEW_POOL = [
    { rating: 5, comment: "Absolutely immaculate vehicle. Arrived spotless and the driver was incredibly professional. Made the whole trip feel first class from start to finish." },
    { rating: 5, comment: "Best car hire experience I've had in Lagos. The booking process was seamless and the car exceeded our expectations. Will definitely book again." },
    { rating: 5, comment: "The Range Rover was pristine and the driver knew every back road. Got us to the airport with time to spare even through the Third Mainland traffic." },
    { rating: 5, comment: "Incredible vehicle, incredibly smooth ride. Perfect for our corporate event — clients were very impressed. Highly recommend for business use." },
    { rating: 4, comment: "Great experience overall. The car was clean and well-maintained. Minor delay at pickup but the host communicated promptly and resolved it quickly." },
    { rating: 4, comment: "Excellent value for the quality on offer. The SUV was spacious and comfortable for our family trip to Ibadan. Would book again." },
    { rating: 4, comment: "Clean, modern car and a responsive host. Everything was as described. Good communication throughout and easy handover process." },
    { rating: 4, comment: "Really solid experience. The van was perfect for our team retreat — 12 of us travelled in comfort. Driver was punctual and professional." },
    { rating: 3, comment: "Decent car and friendly host, though the AC could have been colder. Overall a fair experience and good value for the price." },
];
// ── Seed data ─────────────────────────────────────────────────────────────────
// owner: "admin" = belongs to the admin account; "host" = belongs to Chidi (host@asavio.app)
const PROPERTIES = [
    {
        title: "The Lagos Skyline Penthouse",
        description: "Wake up to panoramic views of Lagos Island from this ultra-modern penthouse. Floor-to-ceiling windows flood every room with natural light. Features a private rooftop terrace, chef's kitchen, and premium smart-home system. Perfectly located minutes from Victoria Island's finest restaurants and nightlife.",
        propertyType: "penthouse",
        bedrooms: 4,
        bathrooms: 4,
        maxGuests: 8,
        pricePerNight: 450000,
        amenities: ["wifi", "pool", "gym", "parking", "ac", "tv", "kitchen", "workspace"],
        location: { address: "15 Ozumba Mbadiwe Avenue", city: "Lagos", state: "Lagos", country: "Nigeria", zipCode: "101241", latitude: 6.428, longitude: 3.424 },
        imageKey: "penthouse",
        owner: "admin",
    },
    {
        title: "Lekki Phase 1 Luxury Apartment",
        description: "A beautifully finished 3-bedroom apartment in the heart of Lekki Phase 1. Contemporary interiors, a fully equipped kitchen, and a private balcony overlooking a lush courtyard. 10 minutes drive to Lekki-Epe Expressway and the best malls in Lagos. Ideal for business travellers and families.",
        propertyType: "apartment",
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 6,
        pricePerNight: 180000,
        amenities: ["wifi", "ac", "tv", "kitchen", "parking", "gym", "workspace"],
        location: { address: "22 Freedom Way", city: "Lagos", state: "Lagos", country: "Nigeria", zipCode: "101233", latitude: 6.447, longitude: 3.476 },
        imageKey: "apartment",
        owner: "host",
    },
    {
        title: "Abuja Central District Executive Suite",
        description: "Sleek and modern executive suite in the Central Business District of Abuja. Steps away from major embassies, banks, and the Transcorp Hilton. Features smart lighting, high-speed fibre, a state-of-the-art kitchen, and 24/7 concierge service.",
        propertyType: "apartment",
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        pricePerNight: 220000,
        amenities: ["wifi", "ac", "tv", "kitchen", "parking", "workspace", "heating"],
        location: { address: "Plot 770 Aminu Kano Crescent", city: "Abuja", state: "FCT", country: "Nigeria", zipCode: "900288", latitude: 9.049, longitude: 7.489 },
        imageKey: "luxury",
        owner: "admin",
    },
    {
        title: "Ikoyi Premium Villa with Pool",
        description: "Nestled in the exclusive Ikoyi enclave, this stunning 5-bedroom villa is the definition of understated luxury. Private swimming pool, tropical garden, a cinema room, and a fully staffed kitchen. Gated and fully secured. Perfect for corporate retreats or milestone celebrations.",
        propertyType: "villa",
        bedrooms: 5,
        bathrooms: 5,
        maxGuests: 12,
        pricePerNight: 500000,
        amenities: ["wifi", "pool", "gym", "parking", "ac", "tv", "kitchen", "bbq", "workspace"],
        location: { address: "7 Kingsway Road", city: "Lagos", state: "Lagos", country: "Nigeria", zipCode: "101223", latitude: 6.455, longitude: 3.439 },
        imageKey: "villa",
        owner: "admin",
    },
    {
        title: "Banana Island Waterfront Duplex",
        description: "Experience life on Nigeria's most prestigious island. This 4-bedroom waterfront duplex offers breathtaking views of the lagoon, a private jetty, infinity pool, and a fully equipped gym. Designed by award-winning architects with imported Italian finishes throughout.",
        propertyType: "duplex",
        bedrooms: 4,
        bathrooms: 4,
        maxGuests: 8,
        pricePerNight: 400000,
        amenities: ["wifi", "pool", "gym", "parking", "ac", "tv", "kitchen", "balcony", "bbq"],
        location: { address: "3 Bourdillon Road", city: "Lagos", state: "Lagos", country: "Nigeria", zipCode: "101219", latitude: 6.463, longitude: 3.441 },
        imageKey: "duplex",
        owner: "admin",
    },
    {
        title: "Port Harcourt GRA Serviced Apartment",
        description: "Modern 3-bedroom serviced apartment in the old GRA, Port Harcourt. Tastefully furnished with a dedicated workspace for business travellers. Includes daily housekeeping, generator backup, a private security guard, and access to a shared rooftop lounge with city views.",
        propertyType: "apartment",
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 6,
        pricePerNight: 130000,
        amenities: ["wifi", "ac", "tv", "kitchen", "parking", "workspace", "heating"],
        location: { address: "45 Old GRA", city: "Port Harcourt", state: "Rivers", country: "Nigeria", zipCode: "500001", latitude: 4.809, longitude: 7.017 },
        imageKey: "apartment",
        owner: "host",
    },
    {
        title: "Asokoro Abuja Luxury 3-Bedroom",
        description: "This stunning Asokoro residence blends contemporary design with traditional African art. Spacious open-plan living area, private garden, and a gourmet kitchen. Located in a quiet, highly secured neighbourhood, minutes from the Presidential Villa and Aso Rock.",
        propertyType: "apartment",
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 6,
        pricePerNight: 200000,
        amenities: ["wifi", "ac", "tv", "kitchen", "parking", "gym", "pool"],
        location: { address: "12 Maiduguri Street", city: "Abuja", state: "FCT", country: "Nigeria", zipCode: "900105", latitude: 9.062, longitude: 7.517 },
        imageKey: "luxury",
        owner: "admin",
    },
    {
        title: "Lagos Island Cosy Studio Loft",
        description: "A beautifully designed studio loft on Lagos Island — ideal for solo travellers or couples. High ceilings, exposed brick, premium mattress, and a fully equipped kitchenette. Walking distance to Tinubu Square, the National Museum, and a short drive to Bar Beach.",
        propertyType: "apartment",
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 2,
        pricePerNight: 75000,
        amenities: ["wifi", "ac", "tv", "kitchen"],
        location: { address: "7 Nnamdi Azikiwe Street", city: "Lagos", state: "Lagos", country: "Nigeria", zipCode: "102273", latitude: 6.451, longitude: 3.397 },
        imageKey: "apartment",
        owner: "host",
    },
];
// owner: "admin" = belongs to admin; "host" = belongs to Chidi (host@asavio.app)
const VEHICLES = [
    {
        make: "Mercedes-Benz",
        model: "S-Class",
        year: 2023,
        vehicleType: "luxury",
        pricePerDay: 200000,
        description: "Experience the pinnacle of automotive luxury. The 2023 S-Class comes with heated and massage seats, Burmester 4D surround sound, Mbux AI assistant, and a silky smooth 3.0L inline-6 engine. Available with or without a professional uniformed driver.",
        seats: 5,
        withDriver: true,
        location: "Lagos Island, Lagos",
        features: ["GPS", "Burmester Sound", "Heated Seats", "Massage Seats", "Apple CarPlay", "Cruise Control"],
        imageKey: "luxury",
        owner: "admin",
    },
    {
        make: "Toyota",
        model: "Land Cruiser V8",
        year: 2022,
        vehicleType: "suv",
        pricePerDay: 150000,
        description: "The unstoppable Land Cruiser V8. Perfect for both city drives and off-road adventures across Nigeria. Seats 7 comfortably, features a premium JBL sound system, multi-terrain select, and a twin-locking rear differential. Ideal for group travel and corporate convoys.",
        seats: 7,
        withDriver: false,
        location: "Victoria Island, Lagos",
        features: ["GPS", "JBL Sound", "Backup Camera", "Android Auto", "Apple CarPlay", "4WD"],
        imageKey: "suv",
        owner: "admin",
    },
    {
        make: "BMW",
        model: "5 Series",
        year: 2023,
        vehicleType: "sedan",
        pricePerDay: 120000,
        description: "The quintessential executive sedan. The 2023 BMW 5 Series delivers razor-sharp handling and a supremely refined interior. Equipped with the latest iDrive 8.5 system, ambient lighting, wireless charging, and a panoramic sunroof. Perfect for business meetings and airport transfers.",
        seats: 5,
        withDriver: false,
        location: "Ikoyi, Lagos",
        features: ["GPS", "Sunroof", "Wireless Charging", "Heated Seats", "Apple CarPlay", "Cruise Control"],
        imageKey: "sedan",
        owner: "host",
    },
    {
        make: "Toyota",
        model: "HiAce (Grand Cabin)",
        year: 2021,
        vehicleType: "van",
        pricePerDay: 80000,
        description: "Nigeria's most trusted people carrier. This 14-seater Grand Cabin is perfect for group airport transfers, corporate shuttles, and family road trips. Comes with individual AC vents, reading lights, reclining seats, and a professional driver. Available for single-day or weekly hire.",
        seats: 14,
        withDriver: true,
        location: "Abuja, FCT",
        features: ["AC", "GPS", "Reclining Seats", "USB Charging", "Backup Camera"],
        imageKey: "van",
        owner: "host",
    },
    {
        make: "Range Rover",
        model: "Autobiography",
        year: 2023,
        vehicleType: "suv",
        pricePerDay: 250000,
        description: "The Range Rover Autobiography — where off-road capability meets five-star luxury. Featuring a rear executive lounge, hand-stitched Windsor leather, 23-speaker Meridian Sound, and a panoramic roof. The ultimate statement vehicle for VIP arrivals and CEO travel.",
        seats: 5,
        withDriver: true,
        location: "Banana Island, Lagos",
        features: ["GPS", "Meridian Sound", "Massage Seats", "Heated Seats", "Apple CarPlay", "Air Suspension"],
        imageKey: "suv",
        owner: "admin",
    },
];
// ── Core seed function (accepts any initialised DataSource) ───────────────────
async function runSeed(ds) {
    const userRepo = ds.getRepository(User_1.User);
    const propertyRepo = ds.getRepository(Property_1.Property);
    const imageRepo = ds.getRepository(Image_1.Image);
    const vehicleRepo = ds.getRepository(Vehicle_1.Vehicle);
    const reviewRepo = ds.getRepository(Review_1.Review);
    // ── Admin user ──────────────────────────────────────────────
    console.log("\n👤 Creating users…");
    let admin = await userRepo.findOne({ where: { email: "asavioluxury@gmail.com" } });
    if (!admin) {
        admin = userRepo.create({
            firstName: "Asavio",
            lastName: "Admin",
            email: "asavioluxury@gmail.com",
            password: await bcryptjs_1.default.hash("Admin123!", 12),
            role: "admin",
            isVerified: true,
            phone: "+2348000000001",
        });
        await userRepo.save(admin);
        console.log("  ✓ Admin  — asavioluxury@gmail.com / Admin123!");
    }
    else {
        console.log("  — Admin already exists, skipping");
    }
    // ── Host user (also acts as the listing owner) ──────────────
    let host = await userRepo.findOne({ where: { email: "host@asavio.app" } });
    if (!host) {
        host = userRepo.create({
            firstName: "Chidi",
            lastName: "Okafor",
            email: "host@asavio.app",
            password: await bcryptjs_1.default.hash("Host123!", 12),
            role: "host",
            isVerified: true,
            kycStatus: "approved",
            phone: "+2348000000002",
        });
        await userRepo.save(host);
        console.log("  ✓ Host   — host@asavio.app / Host123!");
    }
    else {
        console.log("  — Host already exists, skipping");
    }
    // ── Guest user ──────────────────────────────────────────────
    let guest = await userRepo.findOne({ where: { email: "guest@asavio.app" } });
    if (!guest) {
        guest = userRepo.create({
            firstName: "Amaka",
            lastName: "Nwosu",
            email: "guest@asavio.app",
            password: await bcryptjs_1.default.hash("Guest123!", 12),
            role: "user",
            isVerified: true,
            phone: "+2348000000003",
        });
        await userRepo.save(guest);
        console.log("  ✓ Guest  — guest@asavio.app / Guest123!");
    }
    else {
        console.log("  — Guest already exists, skipping");
    }
    // ── Reviewer users ──────────────────────────────────────────
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
        }
        reviewers.push(reviewer);
    }
    console.log(`  ✓ ${reviewers.length} reviewer accounts ready`);
    // ── Properties ──────────────────────────────────────────────
    console.log("\n🏠 Seeding properties…");
    const existingCount = await propertyRepo.count();
    if (existingCount > 0) {
        console.log(`  — ${existingCount} properties already exist, skipping`);
    }
    else {
        for (const data of PROPERTIES) {
            const { imageKey, owner, ...propertyData } = data;
            const property = propertyRepo.create({
                ...propertyData,
                hostId: owner === "host" ? host.id : admin.id,
                isAvailable: true,
                status: "approved",
            });
            const saved = await propertyRepo.save(property);
            // Create image records
            const urls = PROPERTY_IMAGES[imageKey] ?? PROPERTY_IMAGES.apartment;
            const images = urls.map((url, i) => imageRepo.create({
                url,
                publicId: `seed_prop_${saved.id}_${i}`,
                propertyId: saved.id,
                isPrimary: i === 0,
            }));
            await imageRepo.save(images);
            console.log(`  ✓ ${property.title}`);
        }
        // ── Reviews ─────────────────────────────────────────────
        console.log("\n⭐ Seeding reviews…");
        const allProperties = await propertyRepo.find();
        for (let pi = 0; pi < allProperties.length; pi++) {
            const prop = allProperties[pi];
            const count = REVIEWS_PER_PROPERTY[pi % REVIEWS_PER_PROPERTY.length];
            // Pick `count` distinct reviewers
            const pickedReviewers = [...reviewers].sort(() => Math.random() - 0.5).slice(0, count);
            // Pick `count` distinct review entries
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
            // Recompute averageRating and totalReviews from actual rows
            const propReviews = await reviewRepo.find({ where: { propertyId: prop.id } });
            const avg = propReviews.reduce((s, r) => s + r.rating, 0) / propReviews.length;
            await propertyRepo.update(prop.id, {
                totalReviews: propReviews.length,
                averageRating: Math.round(avg * 10) / 10,
            });
            console.log(`  ✓ ${count} reviews → ${prop.title}`);
        }
    }
    // ── Vehicles ────────────────────────────────────────────────
    console.log("\n🚗 Seeding vehicles…");
    const existingVehicleCount = await vehicleRepo.count();
    if (existingVehicleCount > 0) {
        console.log(`  — ${existingVehicleCount} vehicles already exist, skipping`);
    }
    else {
        for (const data of VEHICLES) {
            const { imageKey, owner, ...vehicleData } = data;
            const urls = VEHICLE_IMAGES[imageKey] ?? VEHICLE_IMAGES.sedan;
            const vehicle = vehicleRepo.create({
                ...vehicleData,
                hostId: owner === "host" ? host.id : admin.id,
                isAvailable: true,
                images: urls.map((url, i) => ({ url, publicId: `seed_veh_${i}` })),
            });
            await vehicleRepo.save(vehicle);
            console.log(`  ✓ ${vehicle.year} ${vehicle.make} ${vehicle.model}`);
        }
        // ── Vehicle reviews ──────────────────────────────────────────
        console.log("\n⭐ Seeding vehicle reviews…");
        const allVehicles = await vehicleRepo.find();
        for (let vi = 0; vi < allVehicles.length; vi++) {
            const veh = allVehicles[vi];
            const count = REVIEWS_PER_VEHICLE[vi % REVIEWS_PER_VEHICLE.length];
            const pickedReviewers = [...reviewers].sort(() => Math.random() - 0.5).slice(0, count);
            const pickedContent = [...VEHICLE_REVIEW_POOL].sort(() => Math.random() - 0.5).slice(0, count);
            for (let ri = 0; ri < count; ri++) {
                const review = reviewRepo.create({
                    vehicleId: veh.id,
                    userId: pickedReviewers[ri].id,
                    rating: pickedContent[ri].rating,
                    comment: pickedContent[ri].comment,
                });
                await reviewRepo.save(review);
            }
            // Recompute averageRating and totalReviews from actual rows
            const vehicleReviews = await reviewRepo.find({ where: { vehicleId: veh.id } });
            const avg = vehicleReviews.reduce((s, r) => s + r.rating, 0) / vehicleReviews.length;
            await vehicleRepo.update(veh.id, {
                totalReviews: vehicleReviews.length,
                averageRating: Math.round(avg * 10) / 10,
            });
            console.log(`  ✓ ${count} reviews → ${veh.year} ${veh.make} ${veh.model}`);
        }
    }
    console.log("\n✅ Seed complete!");
    console.log("┌────────────────────────────────────────┐");
    console.log("│  Login credentials                     │");
    console.log("│  Admin:  asavioluxury@gmail.com / Admin123!  │");
    console.log("│  Host:   host@asavio.app  / Host123!   │");
    console.log("│  Guest:  guest@asavio.app / Guest123!  │");
    console.log("└────────────────────────────────────────┘\n");
}
// ── Auto-seed: call this from app startup with the live AppDataSource ─────────
// Only runs when the users table is completely empty (fresh database).
async function autoSeed(ds) {
    try {
        const userCount = await ds.getRepository(User_1.User).count();
        if (userCount > 0)
            return; // database already has data
        console.log("🌱 Empty database detected — running auto-seed…");
        await runSeed(ds);
    }
    catch (err) {
        // Non-fatal: log and continue — the server still starts
        console.error("⚠️  Auto-seed failed (non-fatal):", err.message);
    }
}
// ── Standalone runner: invoked via `npm run seed` ─────────────────────────────
async function main() {
    console.log("🌱 Connecting to database…");
    await SeedDataSource.initialize();
    console.log("✓ Connected\n");
    await runSeed(SeedDataSource);
    await SeedDataSource.destroy();
}
main().catch((err) => {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map