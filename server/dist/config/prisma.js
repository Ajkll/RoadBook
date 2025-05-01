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
 *
 * @module config/prisma
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Charger les variables d'environnement depuis .env
dotenv_1.default.config();
/**
 * Initialisation du client Prisma avec la configuration appropriée.
 * En développement, tous les types de logs sont affichés pour faciliter le débogage.
 * En production ou test, seules les erreurs sont affichées pour éviter de surcharger les logs.
 */
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development"
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});
// Exporter à la fois comme export nommé et export par défaut pour la compatibilité
exports.default = exports.prisma;
