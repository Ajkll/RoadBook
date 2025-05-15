/**
 * Exemple d'utilisation du gestionnaire de connexion Prisma amélioré
 * ==================================================================
 *
 * Ce fichier présente comment utiliser le nouveau gestionnaire de connexion Prisma
 * dans les services de l'application. Il montre les différentes approches pour
 * interagir avec la base de données de manière robuste.
 *
 * @module services/example-prisma-usage
 */

import { User } from '@prisma/client';
import { prismaManager, getPrismaClient, executeDbOperation } from '../config/prisma';
import { logger } from '../utils/logger';

/**
 * Service d'exemple pour démontrer les différentes approches d'utilisation
 * du gestionnaire de connexion Prisma amélioré.
 */
export class UserServiceExample {

  /**
   * Approche 1: Utilisation directe de executeDbOperation
   * Recommandée pour la plupart des opérations simples
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      return await executeDbOperation(async (prisma) => {
        return prisma.user.findUnique({
          where: { id }
        });
      });
    } catch (error) {
      logger.error(`Error getting user by ID ${id}:`, error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  }

  /**
   * Approche 2: Utilisation de getPrismaClient
   * Utile lorsque vous avez besoin de faire plusieurs opérations
   * avec le même client Prisma
   */
  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    try {
      const prisma = await getPrismaClient();
      
      // Vérifier si l'utilisateur existe
      const existingUser = await prisma.user.findUnique({
        where: { id }
      });
      
      if (!existingUser) {
        throw new Error(`User with ID ${id} not found`);
      }
      
      // Mettre à jour le profil utilisateur
      return await prisma.user.update({
        where: { id },
        data
      });
    } catch (error) {
      logger.error(`Error updating user profile for ${id}:`, error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  /**
   * Approche 3: Utilisation de prismaManager.executeWithRetry
   * Recommandée pour les opérations complexes avec contrôle précis
   * sur le nombre de tentatives
   */
  async createUserWithTransaction(userData: any): Promise<User> {
    try {
      return await prismaManager.executeWithRetry(async (prisma) => {
        // Utiliser une transaction pour garantir l'atomicité
        return await prisma.$transaction(async (tx) => {
          // Créer un nouvel utilisateur
          const user = await tx.user.create({
            data: userData
          });
          
          // Créer un roadbook par défaut pour le nouvel utilisateur
          await tx.roadBook.create({
            data: {
              title: 'Mon premier carnet de route',
              description: 'Carnet de route créé automatiquement',
              apprenticeId: user.id
            }
          });
          
          return user;
        });
      }, 3); // 3 tentatives maximum
    } catch (error) {
      logger.error('Error creating user with transaction:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Exemple de gestion d'erreur spécifique pour les problèmes de connexion
   */
  async getAllUsers(): Promise<User[]> {
    try {
      return await executeDbOperation(async (prisma) => {
        return prisma.user.findMany();
      });
    } catch (error) {
      // Analyse de l'erreur pour déterminer si c'est un problème de connexion
      if (error.message?.includes('prepared statement') ||
          error.message?.includes('Connection') || 
          error.message?.includes('connection')) {
        logger.error('Database connection error in getAllUsers:', error);
        throw new Error('Service temporairement indisponible. Veuillez réessayer plus tard.');
      }
      
      // Autres types d'erreurs
      logger.error('Error fetching all users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }
}

export default new UserServiceExample();