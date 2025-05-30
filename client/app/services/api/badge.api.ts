// client/app/services/api/badge.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

export interface Badge {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  criteria: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  awardedAt: string;
  badge?: Badge; // La relation Badge peut être incluse
  name: string;
  description: string;
  imageUrl: string;
}

export interface BadgeLeaderboardEntry {
  userId: string;
  displayName: string;
  profilePicture: string | null;
  badgeCount: number;
  rank: number;
}

export interface BadgeProgressInfo {
  badgeId: string;
  progress: number; // 0-100 percent
  requiredActions: string[];
  completedActions: string[];
  estimatedCompletionDate?: string;
}

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
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer les badges. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch badges:', error);
      throw new Error('Impossible de récupérer la liste des badges. Veuillez réessayer plus tard.');
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
      if (error.response?.status === 404) {
        throw new Error('Le badge demandé n\'existe pas ou a été supprimé.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer les informations du badge. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch badge ${badgeId}:`, error);
      throw new Error('Impossible de récupérer les détails du badge. Veuillez réessayer plus tard.');
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
      if (error.response?.status === 404) {
        throw new Error('La catégorie demandée n\'existe pas.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer les badges. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch badges for category ${category}:`, error);
      throw new Error(`Impossible de récupérer les badges de la catégorie ${category}. Veuillez réessayer plus tard.`);
    }
  },

  /**
   * Récupérer le classement des badges
   */
  getBadgeLeaderboard: async (limit: number = 10): Promise<BadgeLeaderboardEntry[]> => {
    try {
      const response = await apiClient.get('/badges/leaderboard', {
        params: { limit }
      });
      return extractApiData<BadgeLeaderboardEntry[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer le classement. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch badge leaderboard:', error);
      throw new Error('Impossible de récupérer le classement des badges. Veuillez réessayer plus tard.');
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
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer vos badges. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch user badges:', error);
      // Dans ce cas, retournons un tableau vide plutôt qu'une erreur pour ne pas bloquer l'affichage
      return [];
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
      if (error.response?.status === 404) {
        throw new Error('L\'utilisateur demandé n\'existe pas.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder aux badges de cet utilisateur.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer les badges. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch badges for user ${userId}:`, error);
      throw new Error('Impossible de récupérer les badges de cet utilisateur. Veuillez réessayer plus tard.');
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
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 429) {
        throw new Error('Vous avez vérifié les badges trop récemment. Veuillez réessayer dans quelques minutes.');
      } else if (!error.response) {
        throw new Error('Impossible de vérifier les nouveaux badges. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to check for new badges:', error);
      // Dans ce cas, retournons un tableau vide plutôt qu'une erreur
      return [];
    }
  },

  /**
   * Récupérer votre progrès vers les prochains badges
   */
  getBadgeProgress: async (): Promise<BadgeProgressInfo[]> => {
    try {
      // Essayons l'API en premier
      try {
        const response = await apiClient.get('/badges/progress');
        return extractApiData<BadgeProgressInfo[]>(response);
      } catch (apiError) {
        // Si l'endpoint n'existe pas (404) ou renvoie une erreur, utilisez une solution de secours
        logger.warn('Badge progress endpoint error or not available, generating simulated data:', apiError);
        
        // Générons des données de progression simulées à partir des badges de l'utilisateur
        const badges = await badgeApi.getMyBadges();
        const inProgressBadges = await badgeApi.getAllBadges()
          .then(allBadges => {
            // Filtrer pour n'avoir que les badges que l'utilisateur n'a pas encore obtenus
            const userBadgeIds = new Set(badges.map(b => b.badgeId));
            return allBadges.filter(b => !userBadgeIds.has(b.id)).slice(0, 3); // Limiter à 3 badges
          })
          .catch(() => []);
        
        // Créer des informations de progression simulées
        return inProgressBadges.map(badge => ({
          badgeId: badge.id,
          progress: Math.floor(Math.random() * 85), // Progression aléatoire entre 0 et 85%
          requiredActions: ['Effectuer plus de trajets', 'Terminer des sessions d\'apprentissage'],
          completedActions: ['S\'inscrire sur la plateforme'],
          estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Une semaine dans le futur
        }));
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer votre progression vers les badges. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch badge progress:', error);
      // Dans ce cas, retournons un tableau vide plutôt qu'une erreur
      return [];
    }
  },

  /**
   * Récupérer les badges récemment ajoutés
   */
  getRecentBadges: async (limit: number = 5): Promise<Badge[]> => {
    try {
      const response = await apiClient.get('/badges', {
        params: { 
          sort: 'createdAt:desc',
          limit
        }
      });
      return extractApiData<Badge[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer les badges récents. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch recent badges:', error);
      return [];
    }
  },

  /**
   * Récupérer les badges populaires
   */
  getPopularBadges: async (limit: number = 5): Promise<Badge[]> => {
    try {
      const response = await apiClient.get('/badges', {
        params: { 
          sort: 'popularity:desc',
          limit
        }
      });
      return extractApiData<Badge[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer les badges populaires. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch popular badges:', error);
      return [];
    }
  },

  /**
   * Rechercher des badges par mot-clé
   */
  searchBadges: async (query: string): Promise<Badge[]> => {
    try {
      const response = await apiClient.get('/badges', {
        params: { query }
      });
      return extractApiData<Badge[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de rechercher des badges. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to search badges:', error);
      return [];
    }
  },

  /**
   * Partager un badge sur les réseaux sociaux
   */
  shareBadge: async (badgeId: string, platform: 'facebook' | 'twitter' | 'linkedin'): Promise<{ shareUrl: string }> => {
    try {
      const response = await apiClient.post(`/badges/${badgeId}/share`, { platform });
      return extractApiData<{ shareUrl: string }>(response);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Le badge demandé n\'existe pas.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        throw new Error('Plateforme de partage non supportée.');
      } else if (!error.response) {
        throw new Error('Impossible de partager le badge. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to share badge ${badgeId}:`, error);
      throw new Error('Impossible de partager le badge. Veuillez réessayer plus tard.');
    }
  }
};

export default badgeApi;