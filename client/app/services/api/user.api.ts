// client/app/services/api/user.api.ts
import apiClient from './client';
import { logger } from '../../utils/logger';

/**
 * Type pour les statistiques utilisateur
 */
export interface UserStats {
  totalSessions: number;
  totalDistance: number;
  totalDrivingHours: number;
  badgesEarned: number;
  competenciesMastered: number;
  competencyProgress?: {
    notStarted: number;
    inProgress: number;
    mastered: number;
  };
}

/**
 * Type pour l'activité utilisateur
 */
export interface UserActivity {
  recentSessions: Array<{
    id: string;
    date: string;
    duration: number;
    distance?: number;
    startLocation?: string;
    endLocation?: string;
  }>;
  upcomingSessions: Array<{
    id: string;
    date: string;
    duration?: number;
    location?: string;
  }>;
  recentNotifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    date: string;
    isRead: boolean;
  }>;
}

/**
 * API utilisateur pour les opérations spécifiques au profil
 */
const userApi = {
  /**
   * Récupère les statistiques de l'utilisateur
   */
  getUserStats: async (): Promise<UserStats> => {
    try {
      const response = await apiClient.get('/user/stats');
      return response.data;
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      
      // En cas d'erreur, renvoyer des statistiques par défaut
      return {
        totalSessions: 0,
        totalDistance: 0,
        totalDrivingHours: 0,
        competenciesMastered: 0,
        badgesEarned: 0,
        competencyProgress: {
          notStarted: 0,
          inProgress: 0,
          mastered: 0
        }
      };
    }
  },
  
  /**
   * Récupère l'activité récente de l'utilisateur
   */
  getUserActivity: async (): Promise<UserActivity> => {
    try {
      const response = await apiClient.get('/user/activity');
      return response.data;
    } catch (error) {
      logger.error('Error fetching user activity:', error);
      
      // En cas d'erreur, renvoyer des données d'activité vides
      return {
        recentSessions: [],
        upcomingSessions: [],
        recentNotifications: []
      };
    }
  },
  
  /**
   * Met à jour le profil utilisateur
   */
  updateProfile: async (profileData: any): Promise<any> => {
    try {
      const response = await apiClient.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour l'avatar de l'utilisateur
   */
  updateAvatar: async (imageData: any): Promise<any> => {
    try {
      // Créer un FormData pour l'upload d'image
      const formData = new FormData();
      formData.append('avatar', imageData);
      
      const response = await apiClient.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    } catch (error) {
      logger.error('Error updating user avatar:', error);
      throw error;
    }
  },
  
  /**
   * Supprime le compte utilisateur
   */
  deleteAccount: async (password: string): Promise<void> => {
    try {
      await apiClient.post('/user/delete-account', { password });
    } catch (error) {
      logger.error('Error deleting user account:', error);
      throw error;
    }
  }
};

export default userApi;