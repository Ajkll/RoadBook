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
 *
 * @module config/prisma
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis .env
dotenv.config();

// Déclarer variable globale pour usage serverless
declare global {
  var prisma: PrismaClient | undefined;
}

/**
 * Initialisation du client Prisma avec la configuration appropriée.
 * En développement, tous les types de logs sont affichés pour faciliter le débogage.
 * En production ou test, seules les erreurs sont affichées pour éviter de surcharger les logs.
 *
 * Pour les environnements serverless, utilise une instance unique stockée dans global
 * afin d'éviter les problèmes de connexions multiples.
 */
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development"
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// En développement, stocke l'instance dans global pour la réutilisation entre hot-reloads
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Exporter à la fois comme export nommé et export par défaut pour la compatibilité
export default prisma;