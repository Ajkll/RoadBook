/**
 * Configuration globale pour les tests 
 * ===================================
 * 
 * Ce fichier configure l'environnement de test et fournit des fonctions
 * utilitaires pour préparer et nettoyer la base de données entre les tests.
 * 
 * Il intègre également un système de logging détaillé pour améliorer
 * la visibilité des tests en cours d'exécution.
 */

import prisma from "../config/prisma";
import TestLogger, { TestType } from "./utils/test-logger";

// Affiche un message au démarrage de la configuration
console.log("\n🧪 Configuration de l'environnement de test...");

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
    "PasswordReset",
    "RefreshToken",
    "User",
  ];

  TestLogger.info("Nettoyage de la base de données...");
  
  // Désactive temporairement les contraintes de clé étrangère
  await prisma.$executeRaw`SET session_replication_role = 'replica';`;

  // Vide chaque table
  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    } catch (error) {
      TestLogger.warning(`Erreur lors du nettoyage de la table ${tableName}`);
    }
  }

  // Réactive les contraintes de clé étrangère
  await prisma.$executeRaw`SET session_replication_role = 'origin';`;
  
  TestLogger.success("Base de données réinitialisée");
};

// Expose les hooks de configuration de test
export const setupBeforeAll = async () => {
  // S'assure que nous utilisons la base de données de test
  process.env.NODE_ENV = "test";
  TestLogger.info("Environnement configuré: NODE_ENV = test");
  
  // Log l'URL de la base de données utilisée (pour debug)
  const dbUrl = process.env.DATABASE_URL || "(non définie)";
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  TestLogger.info(`URL de la base de données: ${maskedUrl}`);
};

export const setupBeforeEach = async () => {
  await resetDatabase();
};

export const teardownAfterAll = async () => {
  TestLogger.info("Fermeture de la connexion à la base de données...");
  await prisma.$disconnect();
  TestLogger.success("Connexion fermée");
};

// Configurez automatiquement l'environnement
setupBeforeAll().catch(error => {
  console.error("❌ Erreur lors de la configuration de l'environnement de test:", error);
  process.exit(1);
});

// Exposez le logger de test pour pouvoir l'utiliser dans les tests
export { TestLogger, TestType };