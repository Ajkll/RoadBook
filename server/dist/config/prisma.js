"use strict";
/**
 * Configuration Prisma Client
 * ===========================
 *
 * Ce fichier configure et exporte l'instance Prisma Client utilisée dans toute l'application
 * pour interagir avec la base de données PostgreSQL.
 *
 * Fonctionnalités:
 * - Chargement automatique des variables d'environnement
 * - Configuration des logs adaptée selon l'environnement d'exécution
 * - Fournit un point d'accès unique à la base de données pour toute l'application
 * - Configuration spéciale pour environnements serverless (Vercel)
 * - Gestion améliorée des connexions et reconnexions
 *
 * @module config/prisma
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.getPrismaClient = void 0;
exports.executeDbOperation = executeDbOperation;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_manager_1 = __importDefault(require("./prisma-manager"));
const logger_1 = __importDefault(require("../utils/logger"));
// Charger les variables d'environnement depuis .env
dotenv_1.default.config();
/**
 * Initialisation du client Prisma avec la configuration appropriée.
 * En développement, tous les types de logs sont affichés pour faciliter le débogage.
 * En production ou test, seules les erreurs sont affichées pour éviter de surcharger les logs.
 */
const initialPrismaClient = global.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development"
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});
// En développement, stocke l'instance dans global pour la réutilisation entre hot-reloads
if (process.env.NODE_ENV !== 'production') {
    global.prisma = initialPrismaClient;
}
/**
 * Utilise le gestionnaire de connexion Prisma amélioré pour prévenir les erreurs
 * de type "prepared statement does not exist" et gérer les reconnexions.
 *
 * Cette fonction récupère le client avec une vérification de connexion.
 */
const getPrismaClient = async () => {
    try {
        return await prisma_manager_1.default.getClient();
    }
    catch (error) {
        logger_1.default.error('Failed to get Prisma client:', error);
        throw new Error('Database connection error');
    }
};
exports.getPrismaClient = getPrismaClient;
/**
 * Exécute une opération de base de données avec gestion des erreurs et reconnexion
 * Cette fonction est recommandée pour toutes les opérations critiques
 */
async function executeDbOperation(operation) {
    return prisma_manager_1.default.executeWithRetry(operation);
}
/**
 * Pour compatibilité avec le code existant, nous exportons le client
 * Prisma standard qui sera utilisé pour les opérations de base de données.
 *
 * IMPORTANT: Nous utilisons le client initial plutôt que le prismaManager
 * pour garantir la compatibilité avec le code existant, tout en bénéficiant
 * des fonctionnalités de gestion de connexion améliorées pour les nouvelles
 * implémentations.
 */
exports.prisma = initialPrismaClient;
// Exporter à la fois comme export nommé et export par défaut pour la compatibilité
exports.default = exports.prisma;
