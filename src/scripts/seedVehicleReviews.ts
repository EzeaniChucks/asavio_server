// src/scripts/seedVehicleReviews.ts
// Standalone script to seed vehicle reviews on an existing database
// Usage: npm run seed:vehicle-reviews

import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../entities/User";
import { Vehicle } from "../entities/Vehicle";
import { Review } from "../entities/Review";
import { Property } from "../entities/Property";
import { Image } from "../entities/Image";
import { Booking } from "../entities/Booking";

dotenv.config();

const ds = new DataSource({
  type: "postgres",
  url:
    process.env.DATABASE_URL ||
    `postgres://${process.env.DB_USERNAME || "postgres"}:${process.env.DB_PASSWORD || "password"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_DATABASE || "asavio"}`,
  synchronize: true,
  logging: false,
  entities: [User, Property, Image, Vehicle, Booking, Review],
});

const REVIEWER_PERSONAS = [
  { firstName: "Tunde",   lastName: "Adeyemi",  email: "tunde.adeyemi@example.com"  },
  { firstName: "Ngozi",   lastName: "Obi",       email: "ngozi.obi@example.com"       },
  { firstName: "Emeka",   lastName: "Eze",       email: "emeka.eze@example.com"       },
  { firstName: "Fatima",  lastName: "Yusuf",     email: "fatima.yusuf@example.com"    },
  { firstName: "Chukwu",  lastName: "Nwankwo",   email: "chukwu.nwankwo@example.com"  },
];

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

const REVIEWS_PER_VEHICLE = [4, 3, 5, 3, 4];

async function main() {
  console.log("🌱 Connecting to database…");
  await ds.initialize();
  console.log("✓ Connected\n");

  const userRepo = ds.getRepository(User);
  const vehicleRepo = ds.getRepository(Vehicle);
  const reviewRepo = ds.getRepository(Review);

  // Ensure reviewer users exist
  const reviewers: User[] = [];
  for (const persona of REVIEWER_PERSONAS) {
    let reviewer = await userRepo.findOne({ where: { email: persona.email } });
    if (!reviewer) {
      reviewer = userRepo.create({
        ...persona,
        password: await bcrypt.hash("Reviewer123!", 10),
        role: "user",
        isVerified: true,
      });
      await userRepo.save(reviewer);
    }
    reviewers.push(reviewer);
  }
  console.log(`✓ ${reviewers.length} reviewer accounts ready`);

  const vehicles = await vehicleRepo.find();
  console.log(`\n🚗 Found ${vehicles.length} vehicles\n`);

  for (let vi = 0; vi < vehicles.length; vi++) {
    const veh = vehicles[vi];

    const existingReviews = await reviewRepo.find({ where: { vehicleId: veh.id } });
    if (existingReviews.length > 0) {
      console.log(`  — Skipping ${veh.make} ${veh.model} (already has ${existingReviews.length} reviews)`);
      continue;
    }

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

    const vehicleReviews = await reviewRepo.find({ where: { vehicleId: veh.id } });
    const avg = vehicleReviews.reduce((s, r) => s + r.rating, 0) / vehicleReviews.length;
    await vehicleRepo.update(veh.id, {
      totalReviews: vehicleReviews.length,
      averageRating: Math.round(avg * 10) / 10,
    });

    console.log(`  ✓ ${count} reviews → ${veh.year} ${veh.make} ${veh.model} (avg: ${Math.round(avg * 10) / 10})`);
  }

  console.log("\n✅ Vehicle reviews seeded!");
  await ds.destroy();
}

main().catch((err) => {
  console.error("❌ Failed:", err.message);
  process.exit(1);
});
