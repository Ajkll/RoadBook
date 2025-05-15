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

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import prismaManager from './prisma-manager';
import logger from '../utils/logger';

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
 */
const initialPrismaClient = global.prisma || new PrismaClient({
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
export const getPrismaClient = async (): Promise<PrismaClient> => {
  try {
    return await prismaManager.getClient();
  } catch (error) {
    logger.error('Failed to get Prisma client:', error);
    throw new Error('Database connection error');
  }
};

/**
 * Exécute une opération de base de données avec gestion des erreurs et reconnexion
 * Cette fonction est recommandée pour toutes les opérations critiques
 */
export async function executeDbOperation<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return prismaManager.executeWithRetry(operation);
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
export const prisma = initialPrismaClient;

// Exporter à la fois comme export nommé et export par défaut pour la compatibilité
export default prisma;