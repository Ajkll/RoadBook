// services/api/session.api.ts
import apiClient from './client';
import { Session, SessionData, SessionsFilterOptions } from '../../types/session.types';
import { extractApiData, extractErrorMessage } from './utils';
import { formatSessionData, validateSessionData } from '../../utils/UtilsSessionApi';
import { roadbookApi } from './roadbook.api';
import secureStorage from '../secureStorage';

// Flag pour le débogage
const DEBUG = __DEV__;

// Utilitaire pour le logging
const logDebug = (message: string, data?: unknown) => {
  if (DEBUG) {
    if (data) {
      console.log(`🔹 SESSION API: ${message}`, data);
    } else {
      console.log(`🔹 SESSION API: ${message}`);
    }
  }
};

// Utilitaire pour le logging des erreurs
const logError = (message: string, error: unknown) => {
  console.error(`❌ SESSION API ERROR: ${message}`, error);

  // Extraire et logger les détails supplémentaires si disponibles
  if (error.response) {
    console.error('- Status:', error.response.status);
    console.error('- Data:', error.response.data);
  } else if (error.request) {
    console.error('- Request was made but no response received');
  } else {
    console.error('- Error message:', error.message);
  }
};

// Utilitaire pour normaliser les données de session
const normalizeSessionData = (session: any): Session => {
  if (!session) return session;

  // Use notes or description
  let notes = session.notes;
  if (!notes && session.description) {
    notes = session.description;
  }

  // Title fallback
  const title = session.title || (session.roadbook ? session.roadbook.title : null);

  const normalized: Session = {
    id: session.id || '',
    date: session.date || '',
    startTime: session.startTime || '',
    roadbookId: session.roadbookId || '',
    apprenticeId: session.apprenticeId || '',
    title: title,
    description: null, // Not supported yet
    endTime: session.endTime || null,
    duration: session.duration || 0,
    startLocation: session.startLocation || null,
    endLocation: session.endLocation || null,
    distance: session.distance || 0,
    weather: session.weather || null,
    daylight: session.daylight || null,
    sessionType: session.sessionType || 'PRACTICE',
    roadTypes: session.roadTypes || [],
    validatorId: session.validatorId || null,
    notes: notes || null,
    status: session.status || 'PENDING',
    createdAt: session.createdAt || null,
    updatedAt: session.updatedAt || null,
    validationDate: session.validationDate || null,
    apprentice: session.apprentice || null,
    validator: session.validator || null
  };

  return normalized;
};

export const sessionApi = {
  // Helper: Ensure we have a valid roadbook ID
  _ensureRoadbookId: async (): Promise<string> => {
    try {
      const roadbooks = await roadbookApi.getUserRoadbooks('ACTIVE');

      if (roadbooks && roadbooks.length > 0) {
        return roadbooks[0].id;
      }

      // No active roadbook found, create one
      logDebug('No active roadbook found, creating a new one');
      const newRoadbook = await roadbookApi.createRoadbook({
        title: `Roadbook ${new Date().toISOString().split('T')[0]}`,
        description: `Auto-created roadbook`,
        targetHours: 50
      });

      return newRoadbook.id;
    } catch (error) {
      logError('Failed to ensure roadbook ID', error);
      throw new Error('Could not retrieve or create a roadbook. Please try again later.');
    }
  },

  // Helper: Get the current user ID
  _getCurrentUserId: async (): Promise<string> => {
    try {
      const { user } = await secureStorage.getAuthData();
      if (!user || !user.id) {
        throw new Error('User is not logged in or ID is missing');
      }
      return user.id;
    } catch (error) {
      logError('Failed to get current user ID', error);
      throw new Error('Please log in to perform this action');
    }
  },

  // Créer une nouvelle session pour un roadbook
  createSession: async (roadbookId: string, sessionData: SessionData): Promise<Session> => {
    logDebug('Creating new session', { roadbookId, date: sessionData.date });

    // Validate session data first
    const validation = validateSessionData(sessionData);
    if (!validation.valid) {
      const errorMessage = `Invalid session data: ${validation.errors.join(', ')}`;
      logError(errorMessage, { sessionData });
      throw new Error(errorMessage);
    }

    try {
      // If roadbookId is not provided, try to get or create one
      if (!roadbookId) {
        roadbookId = await sessionApi._ensureRoadbookId();
        sessionData.roadbookId = roadbookId;
      }

      // If apprenticeId is not provided, use current user ID
      if (!sessionData.apprenticeId) {
        sessionData.apprenticeId = await sessionApi._getCurrentUserId();
      }

      // Formater les données avant l'envoi
      const formattedData = formatSessionData(sessionData);
      logDebug('Formatted session data', formattedData);

      const response = await apiClient.post(
        `/roadbooks/${roadbookId}/sessions`,
        formattedData
      );

      const session = normalizeSessionData(extractApiData<Session>(response));
      logDebug('Session created successfully', { id: session.id });
      return session;
    } catch (error) {
      logError(`Failed to create session for roadbook ${roadbookId}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to add sessions to this roadbook.");
      } else {
        throw new Error(error.message || 'Failed to create session. Please try again later.');
      }
    }
  },

  // Obtenir une session par son ID
  getSessionById: async (sessionId: string): Promise<Session> => {
    logDebug('Fetching session details', { id: sessionId });

    try {
      const response = await apiClient.get(`/sessions/${sessionId}`);

      const rawData = extractApiData<any>(response);
      logDebug('Raw session data from API', rawData);

      const session = normalizeSessionData(rawData);
      logDebug('Normalized session data', session);

      return session;
    } catch (error) {
      logError(`Failed to fetch session ${sessionId}`, error);

      if (error.response?.status === 404) {
        throw new Error('Session not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to view this session.");
      } else {
        throw new Error('Failed to load session details. Please try again later.');
      }
    }
  },

  // Mettre à jour une session
  updateSession: async (sessionId: string, sessionData: Partial<SessionData>): Promise<Session> => {
    logDebug('Updating session', { id: sessionId });

    try {
      // S'assurer que le formatage est correct pour les données partielles
      const formattedData = formatSessionData({ ...sessionData });

      const response = await apiClient.put(`/sessions/${sessionId}`, formattedData);

      const session = normalizeSessionData(extractApiData<Session>(response));
      logDebug('Session updated successfully');
      return session;
    } catch (error) {
      logError(`Failed to update session ${sessionId}`, error);

      if (error.response?.status === 404) {
        throw new Error('Session not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to update this session.");
      } else {
        throw new Error('Failed to update session. Please try again later.');
      }
    }
  },

  // Supprimer une session
  deleteSession: async (sessionId: string): Promise<void> => {
    logDebug('Deleting session', { id: sessionId });

    try {
      await apiClient.delete(`/sessions/${sessionId}`);
      logDebug('Session deleted successfully');
    } catch (error) {
      logError(`Failed to delete session ${sessionId}`, error);

      if (error.response?.status === 404) {
        throw new Error('Session not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to delete this session.");
      } else {
        throw new Error('Failed to delete session. Please try again later.');
      }
    }
  },

  // Obtenir toutes les sessions de l'utilisateur courant
  getUserSessions: async (filters?: SessionsFilterOptions): Promise<Session[]> => {
    logDebug('Fetching user sessions', filters);

    try {
      // D'abord, récupérer un roadbook actif
      const roadbookId = await sessionApi._ensureRoadbookId();

      // Construire les paramètres de requête
      let url = `/roadbooks/${roadbookId}/sessions`;
      const queryParams = [];

      if (filters) {
        if (filters.status) queryParams.push(`status=${filters.status}`);
        if (filters.startDate) queryParams.push(`startDate=${filters.startDate}`);
        if (filters.endDate) queryParams.push(`endDate=${filters.endDate}`);
        if (filters.sessionType) queryParams.push(`sessionType=${filters.sessionType}`);
      }

      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
      }

      const response = await apiClient.get(url);

      const rawData = extractApiData<any[]>(response);
      logDebug(`Retrieved ${rawData.length} raw sessions`);

      // Normalize each session
      const sessions = rawData.map(session => normalizeSessionData(session));
      logDebug(`Normalized ${sessions.length} sessions`);

      return sessions;
    } catch (error) {
      logError('Failed to fetch user sessions', error);
      throw new Error('Failed to load your sessions. Please try again later.');
    }
  },

  /**
   * Supprime plusieurs sessions selon différents critères
   * @param options {Object} Options de suppression
   * @param options.limit {number} Nombre de sessions à supprimer (les plus récentes en premier). Infinity pour toutes.
   * @param options.filters {SessionsFilterOptions} Filtres optionnels pour sélectionner les sessions
   * @returns {Promise<number>} Nombre de sessions supprimées
   */
  deleteMultipleSessions: async (options: {
    limit: number;
    filters?: SessionsFilterOptions
  }): Promise<number> => {
    const { limit, filters } = options;
    logDebug('Deleting multiple sessions', { limit, filters });

    try {
      // 1. Récupérer les sessions correspondant aux filtres
      const sessions = await sessionApi.getUserSessions(filters);

      // 2. Trier par date (les plus récentes en premier)
      const sortedSessions = [...sessions].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // 3. Déterminer combien supprimer (soit le limit, soit toutes si Infinity)
      const sessionsToDelete = limit === Infinity
        ? sortedSessions
        : sortedSessions.slice(0, limit);

      if (sessionsToDelete.length === 0) {
        logDebug('No sessions to delete matching criteria');
        return 0;
      }

      logDebug(`Preparing to delete ${sessionsToDelete.length} sessions`);

      // 4. Supprimer chaque session (en série pour éviter les erreurs de rate limiting)
      let deletedCount = 0;
      for (const session of sessionsToDelete) {
        try {
          await sessionApi.deleteSession(session.id);
          deletedCount++;
          logDebug(`Deleted session ${session.id} (${deletedCount}/${sessionsToDelete.length})`);
        } catch (error) {
          logError(`Failed to delete session ${session.id}`, error);
          // On continue malgré l'erreur pour les autres sessions
        }
      }

      logDebug(`Successfully deleted ${deletedCount} sessions`);
      return deletedCount;

    } catch (error) {
      logError('Failed in deleteMultipleSessions', error);
      throw new Error('Failed to delete multiple sessions. Please try again later.');
    }
  },

  // Valider une session (pour les instructeurs/validateurs)
  validateSession: async (sessionId: string, isValidated: boolean, feedbackNotes?: string): Promise<Session> => {
    logDebug('Validating session', { id: sessionId, isValidated });

    try {
      const status = isValidated ? 'VALIDATED' : 'REJECTED';

      const response = await apiClient.patch(`/sessions/${sessionId}/validate`, {
        status,
        notes: feedbackNotes
      });

      const session = normalizeSessionData(extractApiData<Session>(response));
      logDebug('Session validation status updated successfully');
      return session;
    } catch (error) {
      logError(`Failed to validate session ${sessionId}`, error);

      if (error.response?.status === 404) {
        throw new Error('Session not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Only guides, instructors, and admins can validate sessions.');
      } else {
        throw new Error('Failed to update validation status. Please try again later.');
      }
    }
  }
};

export default sessionApi;