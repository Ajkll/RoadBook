"use strict";
/**
 * Configuration Prisma Client
 *
 * Ce fichier configure et exporte l'instance Prisma Client utilisée dans toute l'application
 * pour interagir avec la base de données PostgreSQL. La configuration des logs varie selon
 * l'environnement d'exécution.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
// Charger les variables d'environnement depuis .env
dotenv_1.default.config();
// Initialiser le client Prisma avec la configuration appropriée
const prisma = new client_1.PrismaClient({
    // En développement, afficher tous les types de logs
    // En production/test, afficher uniquement les erreurs
    log: process.env.NODE_ENV === "development"
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
});
exports.default = prisma;
