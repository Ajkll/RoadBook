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
import { prismaManager } from './prisma-manager';
import { logger } from '../utils/logger';

// Charger les variables d'environnement depuis .env
dotenv.config();

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
 * Pour compatibilité avec le code existant, nous exportons également
 * une fonction qui peut être utilisée sans await dans les contextes
 * où la connexion devrait déjà être établie.
 *
 * ATTENTION: Préférer l'utilisation de getPrismaClient() ou prismaManager.executeWithRetry()
 * pour une meilleure gestion des erreurs.
 */
export const prisma = {
  async $transaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    const client = await prismaManager.getClient();
    return client.$transaction(callback);
  }
} as unknown as PrismaClient;

/**
 * Exécute une opération de base de données avec gestion des erreurs et reconnexion
 * Cette fonction est recommandée pour toutes les opérations critiques
 */
export async function executeDbOperation<T>(
  operation: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  return prismaManager.executeWithRetry(operation);
}

// Exporter à la fois comme export nommé et export par défaut pour la compatibilité
export default { getPrismaClient, prisma, executeDbOperation };