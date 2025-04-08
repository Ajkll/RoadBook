// server/src/tests/setup.ts
import prisma from "../config/prisma";

// Fonction pour nettoyer la base de données avant/après les tests
export const resetDatabase = async () => {
  // Liste des tables à vider (dans l'ordre inverse des dépendances)
  const tableNames = [
    "Notification",
    "Purchase",
    "MarketplaceListing",
    "UserBadge",
    "Badge",
    "Like",
    "Comment",
    "Post",
    "CompetencyValidation",
    "CompetencyProgress",
    "Competency",
    "Session",
    "RoadBook",
    "User",
  ];

  // Désactive temporairement les contraintes de clé étrangère
  await prisma.$executeRaw`SET session_replication_role = 'replica';`;

  // Vide chaque table
  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    } catch (error) {
      console.warn(`Erreur lors du nettoyage de la table ${tableName}:`, error);
    }
  }

  // Réactive les contraintes de clé étrangère
  await prisma.$executeRaw`SET session_replication_role = 'origin';`;
};

// Configure Jest hooks
export const setupBeforeAll = async () => {
  // S'assure que nous utilisons la base de données de test
  process.env.NODE_ENV = "test";
};

export const setupBeforeEach = async () => {
  await resetDatabase();
};

export const teardownAfterAll = async () => {
  await prisma.$disconnect();
};
