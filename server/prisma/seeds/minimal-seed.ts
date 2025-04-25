// prisma/seeds/minimal-seed.ts
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting minimal database seeding...");

  try {
    // Clear existing users
    console.log("🧹 Cleaning users...");
    await prisma.user.deleteMany();
    console.log("✅ Users cleaned");

    // Create test users
    console.log("👤 Creating test users...");
    
    const defaultPassword = await bcrypt.hash("Password123!", 10);
    
    // Create just the demo test users
    const users = [
      {
        email: "user@roadbook.com",
        passwordHash: defaultPassword,
        displayName: "Demo User",
        firstName: "Demo",
        lastName: "User",
        role: "APPRENTICE" as UserRole,
      },
      {
        email: "guide@roadbook.com",
        passwordHash: defaultPassword,
        displayName: "Demo Guide",
        firstName: "Guide", 
        lastName: "Demo",
        role: "GUIDE" as UserRole,
      },
      {
        email: "admin@roadbook.com",
        passwordHash: defaultPassword,
        displayName: "Admin",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as UserRole,
      }
    ];
    
    for (const user of users) {
      await prisma.user.create({
        data: user
      });
    }
    
    console.log(`✅ Created ${users.length} users`);
    console.log("✅ Minimal seeding completed!");
    
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