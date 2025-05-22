// client/app/services/api/competencies.api.ts
import apiClient from './client';
import { extractApiData } from './utils';
import { logger } from '../../utils/logger';

// Types pour les compétences
export interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  phase: 'INITIAL' | 'INTERMEDIATE' | 'ADVANCED';
  criteria: string[];
  requiredSessions: number;
}

export interface CompetencyProgress {
  id: string;
  competencyId: string;
  competency?: Competency;
  roadbookId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'VALIDATED' | 'FAILED';
  progress: number;
  validatedDate?: string;
  updatedAt: string;
}

export interface CompetencyValidation {
  id: string;
  competencyId: string;
  sessionId: string;
  status: 'VALIDATED' | 'IN_PROGRESS' | 'FAILED';
  feedback?: string;
  createdAt: string;
  validatedBy?: string;
}

export interface CompetencyDetailedProgress extends CompetencyProgress {
  validations: CompetencyValidation[];
  sessions: {
    id: string;
    date: string;
    status: string;
  }[];
}

export interface ApprenticeStats {
  totalCompetencies: number;
  validated: number;
  inProgress: number;
  notStarted: number;
  failed: number;
  progressPercentage: number;
  byPhase: {
    [key: string]: {
      total: number;
      validated: number;
      progressPercentage: number;
    };
  };
}

/**
 * Service pour gérer les opérations liées aux compétences
 */
export const competenciesApi = {
  /**
   * Récupérer toutes les compétences
   */
  getAllCompetencies: async (): Promise<Competency[]> => {
    try {
      const response = await apiClient.get('/competencies');
      return extractApiData<Competency[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error('Failed to fetch all competencies:', error);
      throw error;
    }
  },

  /**
   * Récupérer une compétence par son ID
   */
  getCompetencyById: async (competencyId: string): Promise<Competency> => {
    try {
      const response = await apiClient.get(`/competencies/${competencyId}`);
      return extractApiData<Competency>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 404) {
        throw new Error('Compétence introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch competency with ID ${competencyId}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer les compétences par phase
   */
  getCompetenciesByPhase: async (phase: 'INITIAL' | 'INTERMEDIATE' | 'ADVANCED'): Promise<Competency[]> => {
    try {
      const response = await apiClient.get(`/competencies/phases/${phase}`);
      return extractApiData<Competency[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        throw new Error('Phase de compétence invalide.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch competencies for phase ${phase}:`, error);
      throw error;
    }
  },

  /**
   * Récupérer la progression des compétences pour un roadbook
   */
  getRoadbookCompetenciesProgress: async (roadbookId: string): Promise<CompetencyProgress[]> => {
    try {
      const response = await apiClient.get(`/roadbooks/${roadbookId}/competencies`);
      return extractApiData<CompetencyProgress[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à ce roadbook.');
      } else if (error.response?.status === 404) {
        throw new Error('Roadbook introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to fetch competency progress for roadbook ${roadbookId}:`, error);
      throw error;
    }
  },

  /**
   * Mettre à jour le statut d'une compétence dans un roadbook
   */
  updateCompetencyStatus: async (
    roadbookId: string,
    competencyId: string,
    statusData: { status: 'NOT_STARTED' | 'IN_PROGRESS' | 'VALIDATED' | 'FAILED' }
  ): Promise<CompetencyProgress> => {
    try {
      const response = await apiClient.put(`/roadbooks/${roadbookId}/competencies/${competencyId}`, statusData);
      return extractApiData<CompetencyProgress>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Statut de compétence invalide.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour mettre à jour cette compétence.');
      } else if (error.response?.status === 404) {
        throw new Error('Roadbook ou compétence introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to update competency ${competencyId} status for roadbook ${roadbookId}:`, error);
      throw error;
    }
  },

  /**
   * Obtenir les détails de progression d'une compétence spécifique dans un roadbook
   */
  getCompetencyDetailedProgress: async (roadbookId: string, competencyId: string): Promise<CompetencyDetailedProgress> => {
    try {
      const response = await apiClient.get(`/roadbooks/${roadbookId}/competencies/${competencyId}/detail`);
      return extractApiData<CompetencyDetailedProgress>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à ces détails.');
      } else if (error.response?.status === 404) {
        throw new Error('Roadbook ou compétence introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to get detailed progress for competency ${competencyId} in roadbook ${roadbookId}:`, error);
      throw error;
    }
  },

  /**
   * Obtenir les validations de compétences pour une session
   */
  getSessionCompetencyValidations: async (sessionId: string): Promise<CompetencyValidation[]> => {
    try {
      const response = await apiClient.get(`/sessions/${sessionId}/competencies`);
      return extractApiData<CompetencyValidation[]>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à ces validations.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to get competency validations for session ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Valider des compétences dans une session
   */
  validateSessionCompetencies: async (
    sessionId: string,
    validationData: { competencyIds: string[]; status: 'VALIDATED' | 'IN_PROGRESS' | 'FAILED'; feedback?: string }
  ): Promise<CompetencyValidation[]> => {
    try {
      const response = await apiClient.post(`/sessions/${sessionId}/competencies/validate`, validationData);
      return extractApiData<CompetencyValidation[]>(response);
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Données de validation invalides. Vérifiez les IDs de compétences fournis.');
      } else if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour valider des compétences.');
      } else if (error.response?.status === 404) {
        throw new Error('Session introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to validate competencies for session ${sessionId}:`, error);
      throw error;
    }
  },

  /**
   * Obtenir les statistiques de compétences d'un apprenti
   */
  getApprenticeCompetencyStats: async (apprenticeId: string): Promise<ApprenticeStats> => {
    try {
      const response = await apiClient.get(`/users/${apprenticeId}/competencies/stats`);
      return extractApiData<ApprenticeStats>(response);
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error.response?.status === 403) {
        throw new Error('Vous n\'avez pas les permissions nécessaires pour accéder à ces statistiques.');
      } else if (error.response?.status === 404) {
        throw new Error('Utilisateur introuvable.');
      } else if (!error.response) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      }
      
      logger.error(`Failed to get competency statistics for apprentice ${apprenticeId}:`, error);
      throw error;
    }
  }
};

export default competenciesApi;