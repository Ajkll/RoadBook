// prisma/seeds/progressive-seed.ts
// Seed qui charge les données progressivement pour éviter les problèmes de mémoire
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

interface SeedOptions {
  cleanDatabase?: boolean;
  delay?: number; // Millisecondes entre chaque étape pour permettre la collecte des déchets
  seedModules?: string[]; // Modules spécifiques à charger
}

async function seedStep(
  prisma: PrismaClient,
  stepName: string,
  stepFunction: Function,
  options: SeedOptions
) {
  console.log(`🔄 Seeding step: ${stepName}...`);

  try {
    // Exécute la fonction de seed
    await stepFunction(prisma);

    // Pause pour permettre la collecte des déchets (évite les erreurs de segmentation)
    if (options.delay) {
      console.log(`⏱️ Attente de ${options.delay}ms pour la collecte des déchets...`);
      await new Promise(resolve => setTimeout(resolve, options.delay));
    }

    console.log(`✅ Step ${stepName} completed successfully!`);
    return true;
  } catch (error) {
    console.error(`❌ Error in step ${stepName}:`, error);
    return false;
  }
}

async function clearDatabase(prisma: PrismaClient) {
  console.log("🧹 Cleaning database before seeding...");
  
  try {
    // Delete in reverse order of dependencies, with breaks between deletions
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
    await prisma.passwordReset.deleteMany();
    await prisma.user.deleteMany();
    
    console.log("✅ Database cleaned");
    return true;
  } catch (error) {
    console.error("❌ Error cleaning database:", error);
    return false;
  }
}

export async function progressiveSeed(options: SeedOptions = {}) {
  console.log("🌱 Starting progressive database seeding...");

  // Options par défaut
  const defaultOptions: SeedOptions = {
    cleanDatabase: true,
    delay: 1000,
    seedModules: [
      "users",
      "roadbooks",
      "sessions",
      "competencies",
      "community",
      "badges",
      "marketplace",
      "notifications",
    ],
  };

  // Fusionner les options
  const seedOptions = { ...defaultOptions, ...options };

  const prisma = new PrismaClient();

  try {
    // Nettoyage de la base de données si demandé
    if (seedOptions.cleanDatabase) {
      await clearDatabase(prisma);
    }

    // Modules de seed disponibles
    const seedModulesMap: { [key: string]: Function } = {
      users: seedUsers,
      roadbooks: seedRoadbooks,
      sessions: seedSessions,
      competencies: seedCompetencies,
      community: seedCommunity,
      badges: seedBadges,
      marketplace: seedMarketplace,
      notifications: seedNotifications,
    };

    // Exécuter progressivement chaque module de seed demandé
    for (const moduleName of seedOptions.seedModules || []) {
      const seedFunction = seedModulesMap[moduleName];
      
      if (seedFunction) {
        const success = await seedStep(prisma, moduleName, seedFunction, seedOptions);
        
        if (!success) {
          console.warn(`⚠️ Step ${moduleName} failed. Continuing with next step...`);
        }
      } else {
        console.warn(`⚠️ Unknown seed module: ${moduleName}`);
      }
    }

    console.log("✅ Progressive database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Si exécuté directement, lancer le seeding progressif
if (require.main === module) {
  progressiveSeed().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}