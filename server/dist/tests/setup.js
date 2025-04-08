"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.teardownAfterAll = exports.setupBeforeEach = exports.setupBeforeAll = exports.resetDatabase = void 0;
// server/src/tests/setup.ts
const prisma_1 = __importDefault(require("../config/prisma"));
// Fonction pour nettoyer la base de données avant/après les tests
const resetDatabase = async () => {
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
    await prisma_1.default.$executeRaw `SET session_replication_role = 'replica';`;
    // Vide chaque table
    for (const tableName of tableNames) {
        try {
            await prisma_1.default.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
        }
        catch (error) {
            console.warn(`Erreur lors du nettoyage de la table ${tableName}:`, error);
        }
    }
    // Réactive les contraintes de clé étrangère
    await prisma_1.default.$executeRaw `SET session_replication_role = 'origin';`;
};
exports.resetDatabase = resetDatabase;
// Configure Jest hooks
const setupBeforeAll = async () => {
    // S'assure que nous utilisons la base de données de test
    process.env.NODE_ENV = "test";
};
exports.setupBeforeAll = setupBeforeAll;
const setupBeforeEach = async () => {
    await (0, exports.resetDatabase)();
};
exports.setupBeforeEach = setupBeforeEach;
const teardownAfterAll = async () => {
    await prisma_1.default.$disconnect();
};
exports.teardownAfterAll = teardownAfterAll;
