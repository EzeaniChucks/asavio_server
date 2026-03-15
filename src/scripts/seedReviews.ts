// src/scripts/seedReviews.ts
// Run with: npm run seed:reviews
// Adds real review rows to existing seeded properties and recomputes
// averageRating / totalReviews so card counts match the detail page.
import "reflect-metadata";
import { DataSource } from "typeorm";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "../entities/User";
import { Property } from "../entities/Property";
import { Review } from "../entities/Review";
import { Image } from "../entities/Image";
import { Vehicle } from "../entities/Vehicle";
import { Booking } from "../entities/Booking";

dotenv.config();

const ds = new DataSource({
  type: "postgres",
  url:
    process.env.DATABASE_URL ||
    `postgres://${process.env.DB_USERNAME || "postgres"}:${process.env.DB_PASSWORD || "password"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_DATABASE || "asavio"}`,
  synchronize: false,
  logging: false,
  entities: [User, Property, Image, Vehicle, Booking, Review],
});

const REVIEW_POOL: { rating: number; comment: string }[] = [
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
  { firstName: "Tunde",   lastName: "Adeyemi",  email: "tunde.adeyemi@example.com"  },
  { firstName: "Ngozi",   lastName: "Obi",       email: "ngozi.obi@example.com"       },
  { firstName: "Emeka",   lastName: "Eze",       email: "emeka.eze@example.com"       },
  { firstName: "Fatima",  lastName: "Yusuf",     email: "fatima.yusuf@example.com"    },
  { firstName: "Chukwu",  lastName: "Nwankwo",   email: "chukwu.nwankwo@example.com"  },
];

const REVIEWS_PER_PROPERTY = [5, 4, 3, 5, 4, 3, 4, 3];

async function main() {
  console.log("🌱 Connecting to database…");
  await ds.initialize();
  console.log("✓ Connected\n");

  const userRepo = ds.getRepository(User);
  const propertyRepo = ds.getRepository(Property);
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
