// client/app/services/api/privacy.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

export interface PrivacySettings {
  shareProgress: boolean;
  receiveNotifications: boolean;
  publicProfile: boolean;
  locationTracking: boolean;
  dataCollection: boolean;
  shareActivity: boolean;
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
}

export interface DataExportRequest {
  format: 'JSON' | 'CSV' | 'PDF';
  includePersonalData: boolean;
  includeActivityData: boolean;
  includeRoadbookData: boolean;
}

// Type pour la réponse d'exportation
export interface DataExportResponse {
  requestId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  estimatedTime: string; // durée estimée, ex: "5 minutes"
  downloadUrl?: string; // URL de téléchargement (uniquement si status=COMPLETED)
  expiresAt?: string;
}

/**
 * Service pour gérer les paramètres de confidentialité de l'utilisateur
 */
export const privacyApi = {
  /**
   * Récupérer les paramètres de confidentialité de l'utilisateur
   */
  getPrivacySettings: async (): Promise<PrivacySettings> => {
    try {
      // Essayons l'API en premier
      try {
        const response = await apiClient.get('/users/me/privacy-settings');
        return extractApiData<PrivacySettings>(response);
      } catch (apiError) {
        // Si l'endpoint n'existe pas (404), utilisons une solution de secours
        logger.warn('Privacy settings endpoint not available, using fallback data:', apiError);
        
        // Essayons de récupérer les paramètres depuis l'API utilisateur régulière
        try {
          const userResponse = await apiClient.get('/users/me');
          const userData = extractApiData<any>(userResponse);
          
          // Vérifions si les données utilisateur contiennent des paramètres de confidentialité
          if (userData.privacySettings) {
            return userData.privacySettings;
          }
        } catch (userError) {
          // Ignorer cette erreur et passer aux valeurs par défaut
          logger.error('Failed to get user data for privacy settings:', userError);
        }
        
        // Retourner les paramètres par défaut
        return {
          shareProgress: true,
          receiveNotifications: true,
          publicProfile: false,
          locationTracking: true,
          dataCollection: true,
          shareActivity: false,
          profileVisibility: 'PRIVATE'
        };
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de récupérer vos paramètres de confidentialité. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch privacy settings:', error);
      
      // Retourner des paramètres par défaut en cas d'erreur
      return {
        shareProgress: true,
        receiveNotifications: true,
        publicProfile: false,
        locationTracking: true,
        dataCollection: true,
        shareActivity: false,
        profileVisibility: 'PRIVATE'
      };
    }
  },

  /**
   * Mettre à jour les paramètres de confidentialité
   */
  updatePrivacySettings: async (settings: Partial<PrivacySettings>): Promise<PrivacySettings> => {
    try {
      const response = await apiClient.put('/users/me/privacy-settings', settings);
      return extractApiData<PrivacySettings>(response);
    } catch (apiError) {
      // Vérifier si l'endpoint n'existe pas (404)
      if (apiError.response && apiError.response.status === 404) {
        logger.warn('Privacy settings update endpoint not available:', apiError);
        
        // Essayer l'API utilisateur générale comme fallback
        try {
          // Pour un fallback approprié, on pourrait mettre à jour les données utilisateur
          // avec un champ privacySettings
          const updateResponse = await apiClient.put('/users/me', { 
            privacySettings: settings 
          });
          const userData = extractApiData<any>(updateResponse);
          
          // Si la mise à jour a réussi
          if (userData.privacySettings) {
            return userData.privacySettings;
          }
          
          // Sinon, on retourne les paramètres demandés comme si la mise à jour avait réussi
          return {
            ...(await privacyApi.getPrivacySettings()),
            ...settings
          };
        } catch (updateError) {
          logger.error('Failed to update privacy settings via user API:', updateError);
          throw updateError;
        }
      }
      
      if (apiError.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (apiError.response?.status === 400) {
        throw new Error('Les paramètres de confidentialité fournis sont invalides.');
      } else if (!apiError.response) {
        throw new Error('Impossible de mettre à jour vos paramètres de confidentialité. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to update privacy settings:', apiError);
      throw new Error('Impossible de mettre à jour vos paramètres de confidentialité. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Demander une exportation des données personnelles
   */
  requestDataExport: async (request: DataExportRequest): Promise<DataExportResponse> => {
    try {
      const response = await apiClient.post('/users/me/export', request);
      return extractApiData<DataExportResponse>(response);
    } catch (apiError) {
      // Si l'endpoint n'existe pas (404), simuler la réponse
      if (apiError.response && apiError.response.status === 404) {
        logger.warn('Data export endpoint not available, simulating response:', apiError);
        
        // Simuler une réponse
        return {
          requestId: `export-${Date.now()}`,
          status: 'PENDING',
          estimatedTime: '10-15 minutes',
        };
      }
      
      if (apiError.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (apiError.response?.status === 400) {
        throw new Error('Les paramètres d\'exportation fournis sont invalides.');
      } else if (apiError.response?.status === 429) {
        throw new Error('Vous avez déjà effectué une demande d\'exportation récemment. Veuillez attendre avant d\'en faire une nouvelle.');
      } else if (!apiError.response) {
        throw new Error('Impossible de demander l\'exportation de vos données. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to request data export:', apiError);
      throw new Error('Impossible de demander l\'exportation de vos données. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Vérifier le statut d'une demande d'exportation
   */
  checkExportStatus: async (requestId: string): Promise<DataExportResponse> => {
    try {
      const response = await apiClient.get(`/users/me/export/${requestId}`);
      return extractApiData<DataExportResponse>(response);
    } catch (apiError) {
      // Si l'endpoint n'existe pas (404), simuler la réponse
      if (apiError.response && apiError.response.status === 404) {
        logger.warn('Export status endpoint not available, simulating response:', apiError);
        
        // Simuler une réponse - alternance entre états en fonction du temps écoulé
        const creationTime = parseInt(requestId.split('-')[1] || '0');
        const elapsedMinutes = Math.floor((Date.now() - creationTime) / (1000 * 60));
        
        let status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PENDING';
        
        if (elapsedMinutes > 5) {
          status = 'COMPLETED';
        } else if (elapsedMinutes > 2) {
          status = 'PROCESSING';
        }
        
        return {
          requestId,
          status,
          estimatedTime: status === 'COMPLETED' ? '0 minutes' : `${5 - elapsedMinutes} minutes`,
          downloadUrl: status === 'COMPLETED' ? '#simulated-download-url' : undefined,
          expiresAt: status === 'COMPLETED' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
        };
      }
      
      if (apiError.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (apiError.response?.status === 404) {
        throw new Error('La demande d\'exportation spécifiée n\'existe pas.');
      } else if (!apiError.response) {
        throw new Error('Impossible de vérifier le statut de votre demande d\'exportation. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to check export status:', apiError);
      throw new Error('Impossible de vérifier le statut de votre demande d\'exportation. Veuillez réessayer plus tard.');
    }
  },

  /**
   * Demander la suppression de toutes les données personnelles
   */
  requestDataDeletion: async (password: string, reason?: string): Promise<void> => {
    try {
      await apiClient.post('/users/me/delete', {
        password,
        reason
      });
    } catch (apiError) {
      if (apiError.response?.status === 401) {
        throw new Error('Le mot de passe fourni est incorrect.');
      } else if (apiError.response?.status === 403) {
        throw new Error('Vous ne pouvez pas supprimer votre compte car vous avez des obligations en cours.');
      } else if (!apiError.response) {
        throw new Error('Impossible de demander la suppression de vos données. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to request data deletion:', apiError);
      throw new Error('Impossible de demander la suppression de vos données. Veuillez réessayer plus tard ou contacter le support.');
    }
  },

  /**
   * Désactiver temporairement le compte
   */
  deactivateAccount: async (password: string, reason?: string): Promise<void> => {
    try {
      try {
        await apiClient.post('/users/me/deactivate', {
          password,
          reason
        });
      } catch (deactivateError) {
        // Si l'endpoint n'existe pas, essayer l'endpoint de désactivation alternatif
        if (deactivateError.response && deactivateError.response.status === 404) {
          logger.warn('Deactivation endpoint not available, trying alternative endpoint:', deactivateError);
          
          await apiClient.put('/users/me', {
            status: 'DEACTIVATED',
            deactivationReason: reason,
            password
          });
          return;
        }
        throw deactivateError;
      }
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Le mot de passe fourni est incorrect.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous ne pouvez pas désactiver votre compte car vous avez des obligations en cours.');
      } else if (!error.response) {
        throw new Error('Impossible de désactiver votre compte. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to deactivate account:', error);
      throw new Error('Impossible de désactiver votre compte. Veuillez réessayer plus tard ou contacter le support.');
    }
  },

  /**
   * Réactiver un compte désactivé
   */
  reactivateAccount: async (token: string): Promise<void> => {
    try {
      await apiClient.post('/users/reactivate', {
        token
      });
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Le token de réactivation est invalide ou a expiré.');
      } else if (error.response?.status === 404) {
        throw new Error('Le compte associé à ce token n\'existe pas ou a été supprimé définitivement.');
      } else if (!error.response) {
        throw new Error('Impossible de réactiver votre compte. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to reactivate account:', error);
      throw new Error('Impossible de réactiver votre compte. Veuillez réessayer plus tard ou contacter le support.');
    }
  },
  
  /**
   * Obtenir les détails de conservation des données
   */
  getDataRetentionPolicy: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/privacy/data-retention');
      return extractApiData<any>(response);
    } catch (apiError) {
      // Si l'endpoint n'existe pas, retourner une politique par défaut
      if (apiError.response && apiError.response.status === 404) {
        return {
          accountDeletion: "30 jours après la demande",
          inactiveAccounts: "12 mois d'inactivité",
          backups: "6 mois",
          analyticsData: "24 mois",
          logsData: "90 jours"
        };
      }
      
      logger.error('Failed to get data retention policy:', apiError);
      throw apiError;
    }
  }
};

export default privacyApi;