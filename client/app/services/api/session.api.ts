// client/app/services/api/session.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

// Types pour les sessions
export interface SessionData {
  id?: string;
  roadbookId: string;
  startTime: string;
  endTime?: string;
  distance?: number;
  duration?: number;
  route?: any[];
  weather?: any;
  notes?: string;
  status: 'PENDING' | 'COMPLETED' | 'VALIDATED' | 'REJECTED';
}

export interface SessionComment {
  id?: string;
  text: string;
  userId?: string;
  createdAt?: string;
}

/**
 * Service pour gérer les opérations liées aux sessions
 */
export const sessionApi = {
  /**
   * Récupérer une session par son ID
   */
  getSessionById: async (sessionId: string): Promise<SessionData> => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}`);
      return extractApiData<SessionData>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à cette session.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable. Elle a peut-être été supprimée.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Créer une nouvelle session
   */
  createSession: async (sessionData: SessionData): Promise<SessionData> => {
    try {
      const response = await apiClient.post('/sessions', sessionData);
      return extractApiData<SessionData>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de session invalides. Vérifiez les informations fournies.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to create session:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour une session existante
   */
  updateSession: async (sessionId: string, sessionData: Partial<SessionData>): Promise<SessionData> => {
    try {
      const response = await apiClient.put(`/sessions/${sessionId}`, sessionData);
      return extractApiData<SessionData>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de session invalides. Vérifiez les informations fournies.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour modifier cette session.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable. Elle a peut-être été supprimée.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to update session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Supprimer une session
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    try {
      await apiClient.delete(`/sessions/${sessionId}`);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour supprimer cette session.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable. Elle a peut-être déjà été supprimée.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to delete session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Valider une session
   */
  validateSession: async (sessionId: string, validationData: { feedback?: string; status: 'VALIDATED' | 'REJECTED' }): Promise<SessionData> => {
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/validate`, validationData);
      return extractApiData<SessionData>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de validation invalides. Vérifiez les informations fournies.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour valider cette session.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable. Elle a peut-être été supprimée.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to validate session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Ajouter un commentaire à une session
   */
  addComment: async (sessionId: string, comment: { text: string }): Promise<SessionComment> => {
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/comments`, comment);
      return extractApiData<SessionComment>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de commentaire invalides. Le commentaire ne peut pas être vide.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour commenter cette session.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable. Elle a peut-être été supprimée.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to add comment to session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Obtenir les commentaires d'une session
   */
  getComments: async (sessionId: string): Promise<SessionComment[]> => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/comments`);
      return extractApiData<SessionComment[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour voir les commentaires de cette session.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable. Elle a peut-être été supprimée.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to get comments for session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Obtenir les validations de compétences pour une session
   */
  getCompetencyValidations: async (sessionId: string): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/competencies`);
      return extractApiData<any[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour voir les validations de cette session.');
      } else if (error.response?.status === 404) {
        throw new Error('Session ou validations introuvables.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to get competency validations for session with ID ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Valider des compétences dans une session
   */
  validateCompetencies: async (sessionId: string, competencyData: { competencyIds: string[], status: 'VALIDATED' | 'IN_PROGRESS' | 'FAILED' }): Promise<any> => {
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/competencies/validate`, competencyData);
      return extractApiData<any>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de validation invalides. Vérifiez les IDs de compétences fournis.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour valider des compétences.');
      } else if (error.response?.status === 404) {
        throw new Error('Session ou compétences introuvables.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to validate competencies for session with ID ${sessionId}:`, error);
      throw error;
    }
  }
};

export default sessionApi;