// prisma/seeds/index.ts
import { PrismaClient } from "@prisma/client";
import { seedUsers } from "./01-users";
import { seedRoadbooks } from "./02-roadbooks";
import { seedSessions } from "./03-sessions";
import { seedCompetencies } from "./04-competencies";
import { seedCommunity } from "./05-community";
import { seedBadges } from "./06-badges";
import { seedMarketplace } from "./07-marketplace";
import { seedNotifications } from "./08-notifications";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  try {
    // Clear database if needed - be careful with this in production!
    if (process.env.NODE_ENV === "development") {
      console.log("🧹 Cleaning database before seeding...");
      // Delete in reverse order of dependencies
      await prisma.notification.deleteMany();
      await prisma.purchase.deleteMany();
      await prisma.marketplaceListing.deleteMany();
      await prisma.userBadge.deleteMany();
      await prisma.badge.deleteMany();
      await prisma.like.deleteMany();
      await prisma.comment.deleteMany();
      await prisma.post.deleteMany();
      await prisma.competencyValidation.deleteMany();
      await prisma.competencyProgress.deleteMany();
      await prisma.competency.deleteMany();
      await prisma.session.deleteMany();
      await prisma.roadBook.deleteMany();
      await prisma.refreshToken.deleteMany();
      await prisma.user.deleteMany();
      console.log("✅ Database cleaned");
    }

    // Seed in dependency order
    await seedUsers(prisma);
    await seedRoadbooks(prisma);
    await seedSessions(prisma);
    await seedCompetencies(prisma);
    await seedCommunity(prisma);
    await seedBadges(prisma);
    await seedMarketplace(prisma);
    await seedNotifications(prisma);

    console.log("✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
