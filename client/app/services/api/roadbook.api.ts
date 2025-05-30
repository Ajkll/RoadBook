// client/app/services/api/roadbook.api.ts
import apiClient from './client';
import { Platform } from 'react-native';
import { extractApiData, extractErrorMessage } from './utils';

// Debug flag - easily toggle detailed logging
const DEBUG = __DEV__;

// Utility for logging important information during development
const logDebug = (message: string, data?: unknown) => {
  if (DEBUG) {
    if (data) {
      console.log(`🔹 ROADBOOK API: ${message}`, data);
    } else {
      console.log(`🔹 ROADBOOK API: ${message}`);
    }
  }
};

// Utility for logging errors
const logError = (message: string, error: unknown) => {
  console.error(`❌ ROADBOOK API ERROR: ${message}`, error);

  // Extract and log additional error details if available
  if (error.response) {
    console.error('- Status:', error.response.status);
    console.error('- Data:', error.response.data);
  } else if (error.request) {
    console.error('- Request was made but no response received');
  } else {
    console.error('- Error message:', error.message);
  }
};

// Types for Roadbook API
export interface Roadbook {
  id: string;
  title: string;
  description: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  targetHours: number;
  apprenticeId: string;
  guideId?: string;
  createdAt: string;
  updatedAt: string;
  apprentice?: {
    id: string;
    displayName: string;
    email: string;
    profilePicture?: string;
  };
  guide?: {
    id: string;
    displayName: string;
    email: string;
    profilePicture?: string;
  };
  _count?: {
    sessions: number;
  };
}

export interface Session {
  id: string;
  roadbookId: string;
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  startLocation?: string;
  endLocation?: string;
  distance?: number;
  routeData?: Record<string, unknown>;
  weather?: string;
  daylight?: string;
  roadTypes?: string[];
  notes?: string;
  apprenticeId: string;
  validatorId?: string;
  validationDate?: string;
  apprentice?: {
    id: string;
    displayName: string;
  };
  validator?: {
    id: string;
    displayName: string;
  };
  competencyValidations?: Record<string, unknown>[];
}

export interface CompetencyProgress {
  roadbookId: string;
  competencyId: string;
  apprenticeId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';
  notes?: string;
  lastPracticed?: string;
  competency: {
    id: string;
    name: string;
    description: string;
    phase: number;
    order: number;
  };
}

export interface CreateRoadbookRequest {
  title: string;
  description: string;
  targetHours?: number;
  guideId?: string;
}

export interface CreateSessionRequest {
  date: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  startLocation?: string;
  endLocation?: string;
  distance?: number;
  routeData?: Record<string, unknown>;
  weather?: string;
  daylight?: string;
  roadTypes?: string[];
  notes?: string;
  validatorId?: string;
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

// RoadBook API Service
export const roadbookApi = {
  // Get all user's roadbooks
  getUserRoadbooks: async (status?: string): Promise<Roadbook[]> => {
    logDebug('Fetching user roadbooks', { status });

    try {
      const url = status ? `/roadbooks?status=${status}` : '/roadbooks';
      const response = await apiClient.get(url);

      const roadbooks = extractApiData<Roadbook[]>(response);
      logDebug(`Retrieved ${roadbooks.length} roadbooks`);
      return roadbooks;
    } catch (error) {
      logError('Failed to fetch user roadbooks', error);
      throw new Error('Failed to load your roadbooks. Please try again later.');
    }
  },

  // Create a new roadbook
  createRoadbook: async (data: CreateRoadbookRequest): Promise<Roadbook> => {
    logDebug('Creating new roadbook', { title: data.title });

    try {
      const response = await apiClient.post('/roadbooks', data);

      const roadbook = extractApiData<Roadbook>(response);
      logDebug('Roadbook created successfully', { id: roadbook.id });
      return roadbook;
    } catch (error) {
      logError('Failed to create roadbook', error);
      throw new Error('Failed to create your roadbook. Please try again later.');
    }
  },

  // Get roadbook by ID
  getRoadbookById: async (id: string): Promise<Roadbook> => {
    logDebug('Fetching roadbook details', { id });

    try {
      const response = await apiClient.get(`/roadbooks/${id}`);

      const roadbook = extractApiData<Roadbook>(response);
      logDebug('Roadbook details retrieved successfully');
      return roadbook;
    } catch (error) {
      logError(`Failed to fetch roadbook ${id}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to view this roadbook.");
      } else {
        throw new Error('Failed to load roadbook details. Please try again later.');
      }
    }
  },

  // Update a roadbook
  updateRoadbook: async (id: string, data: Partial<CreateRoadbookRequest>): Promise<Roadbook> => {
    logDebug('Updating roadbook', { id, data });

    try {
      const response = await apiClient.put(`/roadbooks/${id}`, data);

      const roadbook = extractApiData<Roadbook>(response);
      logDebug('Roadbook updated successfully');
      return roadbook;
    } catch (error) {
      logError(`Failed to update roadbook ${id}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to update this roadbook.");
      } else {
        throw new Error('Failed to update roadbook. Please try again later.');
      }
    }
  },

  // Delete a roadbook
  deleteRoadbook: async (id: string): Promise<void> => {
    logDebug('Deleting roadbook', { id });

    try {
      await apiClient.delete(`/roadbooks/${id}`);
      logDebug('Roadbook deleted successfully');
    } catch (error) {
      logError(`Failed to delete roadbook ${id}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to delete this roadbook.");
      } else {
        throw new Error('Failed to delete roadbook. Please try again later.');
      }
    }
  },

  // Update roadbook status
  updateRoadbookStatus: async (
    id: string,
    status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  ): Promise<Roadbook> => {
    logDebug('Updating roadbook status', { id, status });

    try {
      const response = await apiClient.patch(`/roadbooks/${id}/status`, {
        status,
      });

      const roadbook = extractApiData<Roadbook>(response);
      logDebug('Roadbook status updated successfully');
      return roadbook;
    } catch (error) {
      logError(`Failed to update roadbook status ${id}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to update this roadbook status.");
      } else {
        throw new Error('Failed to update roadbook status. Please try again later.');
      }
    }
  },

  // Assign a guide to a roadbook
  assignGuide: async (id: string, guideId: string): Promise<Roadbook> => {
    logDebug('Assigning guide to roadbook', { id, guideId });

    try {
      const response = await apiClient.post(`/roadbooks/${id}/guide`, {
        guideId,
      });

      const roadbook = extractApiData<Roadbook>(response);
      logDebug('Guide assigned successfully');
      return roadbook;
    } catch (error) {
      logError(`Failed to assign guide to roadbook ${id}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook or guide not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to assign guides to this roadbook.");
      } else if (error.response?.status === 400) {
        throw new Error('Invalid guide assignment. The user may not have the required role.');
      } else {
        throw new Error('Failed to assign guide. Please try again later.');
      }
    }
  },

  // Get roadbooks where user is assigned as a guide
  getGuidedRoadbooks: async (status?: string): Promise<Roadbook[]> => {
    logDebug('Fetching roadbooks where user is a guide', { status });

    try {
      const url = status ? `/roadbooks/guided?status=${status}` : '/roadbooks/guided';
      const response = await apiClient.get(url);

      const roadbooks = extractApiData<Roadbook[]>(response);
      logDebug(`Retrieved ${roadbooks.length} guided roadbooks`);
      return roadbooks;
    } catch (error) {
      logError('Failed to fetch guided roadbooks', error);

      if (error.response?.status === 403) {
        throw new Error('Only guides, instructors, and admins can access this feature.');
      } else {
        throw new Error('Failed to load guided roadbooks. Please try again later.');
      }
    }
  },

  // Get sessions for a roadbook
  getRoadbookSessions: async (id: string): Promise<Session[]> => {
    logDebug('Fetching sessions for roadbook', { id });

    try {
      const response = await apiClient.get(`/roadbooks/${id}/sessions`);

      const sessions = extractApiData<Session[]>(response);
      logDebug(`Retrieved ${sessions.length} sessions`);
      return sessions;
    } catch (error) {
      logError(`Failed to fetch sessions for roadbook ${id}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to view sessions in this roadbook.");
      } else {
        throw new Error('Failed to load sessions. Please try again later.');
      }
    }
  },

  // Create a new session
  createSession: async (roadbookId: string, data: CreateSessionRequest): Promise<Session> => {
    logDebug('Creating new session', { roadbookId, date: data.date });

    try {
      const response = await apiClient.post(
        `/roadbooks/${roadbookId}/sessions`,
        data
      );

      const session = extractApiData<Session>(response);
      logDebug('Session created successfully', { id: session.id });
      return session;
    } catch (error) {
      logError(`Failed to create session for roadbook ${roadbookId}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to add sessions to this roadbook.");
      } else {
        throw new Error('Failed to create session. Please try again later.');
      }
    }
  },

  // Get competency progress for a roadbook
  getCompetencyProgress: async (id: string): Promise<CompetencyProgress[]> => {
    logDebug('Fetching competency progress for roadbook', { id });

    try {
      const response = await apiClient.get(
        `/roadbooks/${id}/competencies`
      );

      const competencies = extractApiData<CompetencyProgress[]>(response);
      logDebug(`Retrieved progress for ${competencies.length} competencies`);
      return competencies;
    } catch (error) {
      logError(`Failed to fetch competency progress for roadbook ${id}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook not found.');
      } else if (error.response?.status === 403) {
        throw new Error("You don't have permission to view competency progress in this roadbook.");
      } else {
        throw new Error('Failed to load competency progress. Please try again later.');
      }
    }
  },

  // Update competency status
  updateCompetencyStatus: async (
    roadbookId: string,
    competencyId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED',
    notes?: string
  ): Promise<CompetencyProgress> => {
    logDebug('Updating competency status', { roadbookId, competencyId, status });

    try {
      const response = await apiClient.patch(
        `/roadbooks/${roadbookId}/competencies/${competencyId}`,
        { status, notes }
      );

      const competency = extractApiData<CompetencyProgress>(response);
      logDebug('Competency status updated successfully');
      return competency;
    } catch (error) {
      logError(`Failed to update competency status for roadbook ${roadbookId}`, error);

      if (error.response?.status === 404) {
        throw new Error('Roadbook or competency not found.');
      } else if (error.response?.status === 403) {
        throw new Error('Only guides, instructors, and admins can update competency status.');
      } else {
        throw new Error('Failed to update competency status. Please try again later.');
      }
    }
  },

  // Test connection to API
  testConnection: async (): Promise<{ status: string; details: Record<string, unknown> }> => {
    logDebug('Testing connection to RoadBook API');
    
    // Get client URL 
    const apiUrl = apiClient.defaults.baseURL;
    const { apiProxy } = require('../../api-proxy');
    const tunnelMode = apiProxy.isTunnelMode();
    const hostUri = require('expo-constants').default.expoConfig?.hostUri || 'N/A';
    
    try {
      const startTime = Date.now();
      // Try the health endpoint instead of root
      const response = await apiClient.get('/health');
      const pingTime = Date.now() - startTime;

      return {
        status: 'success',
        details: {
          pingTime: `${pingTime}ms`,
          serverResponse: response.data,
          apiUrl: apiUrl,
          tunnelMode: tunnelMode,
          hostUri: hostUri,
          platform: Platform.OS,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      logError('API connection test failed', error);

      return {
        status: 'error',
        details: {
          message: error.message,
          apiUrl: apiUrl,
          tunnelMode: tunnelMode,
          hostUri: hostUri,
          platform: Platform.OS,
          networkError: !error.response,
          statusCode: error.response?.status,
          serverMessage: error.response?.data,
          timestamp: new Date().toISOString(),
        },
      };
    }
  },
};

export default roadbookApi;