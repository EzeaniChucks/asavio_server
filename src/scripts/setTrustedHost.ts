// src/scripts/setTrustedHost.ts
//
// Directly sets hostTier = 'trusted_host' for a user by name.
// Safe to re-run — idempotent.
//
// Run with:  npx ts-node src/scripts/setTrustedHost.ts
//
import "reflect-metadata";
import { DataSource } from "typeorm";
import dotenv from "dotenv";

import { User }         from "../entities/User";
import { Property }     from "../entities/Property";
import { Image }        from "../entities/Image";
import { Vehicle }      from "../entities/Vehicle";
import { Booking }      from "../entities/Booking";
import { Review }       from "../entities/Review";
import { Conversation } from "../entities/Conversation";
import { Message }      from "../entities/Message";

dotenv.config();

const ds = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL ||
    `postgres://${process.env.DB_USERNAME || "postgres"}:${process.env.DB_PASSWORD || "password"}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_DATABASE || "asavio"}`,
  synchronize: false,
  logging: false,
  entities: [User, Property, Image, Vehicle, Booking, Review, Conversation, Message],
});

// ── hosts to promote ─────────────────────────────────────────────────────────
const TRUSTED_HOSTS = [
  { firstName: "Alakinde", lastName: "Boluwatife" },
];

async function main() {
  console.log("🔗 Connecting to database…");
  await ds.initialize();
  console.log("✓ Connected\n");

  const userRepo = ds.getRepository(User);

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
