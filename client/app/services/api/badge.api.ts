// client/app/services/api/badge.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

export type Badge = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  criteria: string;
};

export type UserBadge = {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  badge?: Badge;  // La relation Badge peut être incluse
};

/**
 * Service pour gérer les badges des utilisateurs
 */
export const badgeApi = {
  /**
   * Récupérer tous les badges disponibles
   */
  getAllBadges: async (): Promise<Badge[]> => {
    try {
      const response = await apiClient.get('/badges');
      return extractApiData<Badge[]>(response);
    } catch (error) {
      logger.error('Failed to fetch badges:', error);
      throw error;
    }
  },

  /**
   * Récupérer un badge spécifique par son ID
   */
  getBadgeById: async (badgeId: string): Promise<Badge> => {
    try {
      const response = await apiClient.get(`/badges/${badgeId}`);
      return extractApiData<Badge>(response);
    } catch (error) {
      logger.error(`Failed to fetch badge ${badgeId}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer les badges d'une catégorie spécifique
   */
  getBadgesByCategory: async (category: string): Promise<Badge[]> => {
    try {
      const response = await apiClient.get(`/badges/categories/${category}`);
      return extractApiData<Badge[]>(response);
    } catch (error) {
      logger.error(`Failed to fetch badges for category ${category}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer le classement des badges
   */
  getBadgeLeaderboard: async (): Promise<any[]> => {
    try {
      const response = await apiClient.get('/badges/leaderboard');
      return extractApiData<any[]>(response);
    } catch (error) {
      logger.error('Failed to fetch badge leaderboard:', error);
      throw error;
    }
  },

  /**
   * Récupérer les badges de l'utilisateur actuel
   */
  getMyBadges: async (): Promise<UserBadge[]> => {
    try {
      const response = await apiClient.get('/badges/users/me');
      return extractApiData<UserBadge[]>(response);
    } catch (error) {
      logger.error('Failed to fetch user badges:', error);
      throw error;
    }
  },

  /**
   * Récupérer les badges d'un utilisateur spécifique
   */
  getUserBadges: async (userId: string): Promise<UserBadge[]> => {
    try {
      const response = await apiClient.get(`/badges/users/${userId}`);
      return extractApiData<UserBadge[]>(response);
    } catch (error) {
      logger.error(`Failed to fetch badges for user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Vérifier et attribuer de nouveaux badges à l'utilisateur actuel
   */
  checkForNewBadges: async (): Promise<UserBadge[]> => {
    try {
      const response = await apiClient.post('/badges/check');
      return extractApiData<UserBadge[]>(response);
    } catch (error) {
      logger.error('Failed to check for new badges:', error);
      throw error;
    }
  },
};

export default badgeApi;