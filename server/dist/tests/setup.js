"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestType = exports.TestLogger = exports.teardownAfterAll = exports.setupBeforeEach = exports.setupBeforeAll = exports.resetDatabase = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const test_logger_1 = __importStar(require("./utils/test-logger"));
exports.TestLogger = test_logger_1.default;
Object.defineProperty(exports, "TestType", { enumerable: true, get: function () { return test_logger_1.TestType; } });
// Affiche un message au démarrage de la configuration
console.log("\n🧪 Configuration de l'environnement de test...");
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
        "PasswordReset",
        "RefreshToken",
        "User",
    ];
    test_logger_1.default.info("Nettoyage de la base de données...");
    // Désactive temporairement les contraintes de clé étrangère
    await prisma_1.default.$executeRaw `SET session_replication_role = 'replica';`;
    // Vide chaque table
    for (const tableName of tableNames) {
        try {
            await prisma_1.default.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
        }
        catch (error) {
            test_logger_1.default.warning(`Erreur lors du nettoyage de la table ${tableName}`);
        }
    }
    // Réactive les contraintes de clé étrangère
    await prisma_1.default.$executeRaw `SET session_replication_role = 'origin';`;
    test_logger_1.default.success("Base de données réinitialisée");
};
exports.resetDatabase = resetDatabase;
// Expose les hooks de configuration de test
const setupBeforeAll = async () => {
    // S'assure que nous utilisons la base de données de test
    process.env.NODE_ENV = "test";
    test_logger_1.default.info("Environnement configuré: NODE_ENV = test");
    // Log l'URL de la base de données utilisée (pour debug)
    const dbUrl = process.env.DATABASE_URL || "(non définie)";
    const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
    test_logger_1.default.info(`URL de la base de données: ${maskedUrl}`);
};
exports.setupBeforeAll = setupBeforeAll;
const setupBeforeEach = async () => {
    await (0, exports.resetDatabase)();
};
exports.setupBeforeEach = setupBeforeEach;
const teardownAfterAll = async () => {
    test_logger_1.default.info("Fermeture de la connexion à la base de données...");
    await prisma_1.default.$disconnect();
    test_logger_1.default.success("Connexion fermée");
};
exports.teardownAfterAll = teardownAfterAll;
// Configurez automatiquement l'environnement
(0, exports.setupBeforeAll)().catch(error => {
    console.error("❌ Erreur lors de la configuration de l'environnement de test:", error);
    process.exit(1);
});
