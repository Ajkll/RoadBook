// client/app/services/api/auth.api.ts
import axios, { AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TokenRefreshResponse,
  User,
} from '../../types/auth.types';
import { saveAuthData, getItem, clearAuthData, STORAGE_KEYS } from '../secureStorage';
import apiClient, { API_URL, API_CONFIG } from './client'; // Import our central API client and configuration
import { logger } from '../../utils/logger';
import { extractApiData, extractErrorMessage } from './utils';

// Log API configuration for debugging
console.log('🔄 AUTH API: Using URL from central API client:', API_URL);
console.log('🔄 AUTH API: Using production API:', API_CONFIG.USING_PRODUCTION ? 'Yes' : 'No');

// Debug flag - easily toggle detailed logging
const DEBUG = true;

// Utility for logging important information during development
const logDebug = (message: string, data?: unknown) => {
  if (DEBUG) {
    if (data) {
      console.log(`🔹 AUTH API: ${message}`, data);
    } else {
      console.log(`🔹 AUTH API: ${message}`);
    }
  }
};

// Utility for logging errors
const logError = (message: string, error: unknown) => {
  logger.error(`❌ AUTH API ERROR: ${message}`, error);

  // Extract and log additional error details if available
  if (error.response) {
    logger.error('- Status:', error.response.status);
    logger.error('- Data:', error.response.data);
    logger.error('- Headers:', error.response.headers);
  } else if (error.request) {
    logger.error('- Request was made but no response received');
    logger.error('- Request:', error.request);
  } else {
    logger.error('- Error message:', error.message);
  }

  // Log network information if available
  if (error.config) {
    logger.error('- Request URL:', error.config.url);
    logger.error('- Request Method:', error.config.method?.toUpperCase());
    logger.error('- Request Headers:', error.config.headers);

    // Don't log sensitive data in production, but helpful for debugging
    if (DEBUG && error.config.data) {
      try {
        // Attempt to parse and sanitize sensitive data
        const configData = JSON.parse(error.config.data);
        const sanitizedData = { ...configData };
        if (sanitizedData.password) sanitizedData.password = '******';
        logger.error('- Request Data (sanitized):', sanitizedData);
      } catch {
        logger.error('- Request Data: [Could not parse]');
      }
    }
  }
};

// Use the centralized API client from client.ts instead of creating a new one
// This ensures we use the same API client and configuration throughout the app

// Function to log the current API configuration
const logApiConfig = () => {
  logDebug(`Current API configuration:`, {
    url: API_URL,
    usingProduction: API_CONFIG.USING_PRODUCTION,
    baseURL: apiClient.defaults.baseURL,
    platform: Platform.OS
  });
};

// Helper function to measure and log request timing
const measureRequestTime = async <T>(
  requestName: string, 
  requestFn: () => Promise<T>
): Promise<T> => {
  // Log the current API configuration before each request
  logApiConfig();
  
  const startTime = Date.now();
  try {
    const result = await requestFn();
    const duration = Date.now() - startTime;
    logDebug(`${requestName} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logError(`${requestName} failed after ${duration}ms`, error);
    throw error;
  }
};

// Helper for token refresh
const refreshAuthToken = async (refreshToken: string): Promise<string> => {
  logDebug('Attempting to refresh access token');
  
  try {
    // Use the centralized API URL 
    logDebug(`Using central API URL for token refresh: ${API_URL}`);
    
    const response = await axios.post(
      `${API_URL}/auth/refresh-token`,
      { refreshToken },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Platform': Platform.OS,
        },
      }
    );

    if (!response.data.accessToken) {
      throw new Error('Invalid refresh token response');
    }

    const newAccessToken = response.data.accessToken;
    await saveItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    
    // Update the auth header for future requests
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
    
    return newAccessToken;
  } catch (error) {
    logError('Token refresh failed', error);
    await clearAuthData();
    throw {
      ...error,
      isRefreshError: true,
      message: 'Session expired. Please login again.',
    };
  }
};

// Enhanced API methods with comprehensive logging
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    // Log only non-sensitive data
    logDebug('Registration attempt with data', {
      email: data.email,
      displayName: data.displayName,
      role: data.role,
    });

    return measureRequestTime('Registration request', async () => {
      try {
        // Send to user API endpoints as that's what the server expects
        // Try both /users and /auth/register endpoints in case one fails
        try {
          // First try /users endpoint
          const response = await apiClient.post('/users', data);
          const authData = extractApiData<AuthResponse>(response);
          logDebug('Server response for registration:', authData);
          return authData;
        } catch (firstError) {
          logError('First registration attempt failed, trying alternate endpoint', firstError);

          // Fallback to /auth/register endpoint
          const response = await apiClient.post('/auth/register', data);
          const authData = extractApiData<AuthResponse>(response);
          logDebug('Server response for registration (fallback endpoint):', authData);
          return authData;
        }
      } catch (error) {
        logError('Registration failed after all attempts', error);
        throw error;
      }
    });
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    logDebug('Attempting login', { email: credentials.email });

    // Log API configuration using our centralized settings
    const connectionInfo = {
      apiUrl: API_URL,
      usingProduction: API_CONFIG.USING_PRODUCTION,
      platform: Platform.OS,
      hostUri: require('expo-constants').default.expoConfig?.hostUri || 'N/A'
    };
    
    logDebug(`Login endpoint connection info:`, connectionInfo);

    return measureRequestTime('Login request', async () => {
      try {
        const response = await apiClient.post('/auth/login', credentials);
        
        // Use utility function to extract data regardless of response format
        const authData = extractApiData<AuthResponse>(response);

        logDebug(`Login successful`, {
          userId: authData.user.id,
          role: authData.user.role,
          displayName: authData.user.displayName,
          tokenReceived: !!authData.accessToken,
        });

        // Check if response contains expected data
        if (!authData.accessToken || !authData.user) {
          logError('Login response missing critical data', authData);
          throw new Error('Réponse du serveur invalide');
        }

        // Store authentication data securely
        await saveAuthData(authData.accessToken, authData.refreshToken, authData.user);

        logDebug('Authentication data stored securely');
        return authData;
      } catch (error) {
        // Provide specific error messages based on the server response
        if (error.response?.status === 401) {
          throw new Error('Email ou mot de passe incorrect');
        } else if (error.response?.status === 400) {
          throw new Error('Données de connexion invalides');
        } else if (!error.response) {
          throw new Error(
            'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
          );
        } else {
          throw new Error('La connexion a échoué. Veuillez réessayer plus tard.');
        }
      }
    });
  },

  logout: async (): Promise<void> => {
    logDebug('Initiating logout process');

    return measureRequestTime('Logout request', async () => {
      // First, ensure we're clearing local data regardless of server success
      const clearLocalData = async () => {
        try {
          // Clear auth data from secure storage
          await clearAuthData();
          logDebug('Local authentication data cleared');
          return true;
        } catch (clearError) {
          logError('Failed to clear auth data using clearAuthData', clearError);
          
          // Attempt clearing individual items as fallback
          try {
            logDebug('Attempting fallback clear method');
            const keys = [STORAGE_KEYS.ACCESS_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER];
            let success = true;
            
            for (const key of keys) {
              try {
                await saveItem(key, '');
                logDebug(`Cleared ${key}`);
              } catch (e) {
                logError(`Failed to clear ${key}`, e);
                success = false;
              }
            }
            
            return success;
          } catch (fallbackError) {
            logError('Complete failure clearing auth data', fallbackError);
            return false;
          }
        }
      };
      
      try {
        // Try to get the refresh token, but don't fail if not found
        let refreshToken = null;
        try {
          refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (tokenError) {
          logDebug('Error retrieving refresh token - may already be logged out');
        }

        // Parallel operations: try server logout and clear local data at the same time
        const operations = [clearLocalData()];
        
        // Only attempt server logout if we have a token
        if (refreshToken) {
          operations.push(
            apiClient.post('/auth/logout')
              .then(() => {
                logDebug('Logout request successful');
                return true;
              })
              .catch(serverError => {
                logError('Logout request failed on server', serverError);
                logDebug('Proceeding with local logout despite server error');
                return false;
              })
          );
        } else {
          logDebug('No refresh token found, skipping server logout');
        }
        
        // Wait for all operations to complete
        await Promise.all(operations);
        logDebug('Logout process completed');
        
      } catch (error) {
        logError('Unexpected error during logout process', error);
        // Still try to clear data as a last resort
        await clearLocalData();
      }
    });
  },

  refreshToken: async (): Promise<TokenRefreshResponse> => {
    logDebug('Attempting to refresh token');

    return measureRequestTime('Token refresh request', async () => {
      try {
        const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          logDebug('No refresh token found in storage');
          throw new Error('No refresh token available');
        }

        const tokenPreview = `${refreshToken.substring(0, 10)}...`;
        logDebug(`Using refresh token: ${tokenPreview}`);

        const response = await apiClient.post('/auth/refresh-token', {
          refreshToken,
        });

        const tokenData = extractApiData<TokenRefreshResponse>(response);

        if (!tokenData.accessToken) {
          logError('Refresh token response missing access token', tokenData);
          throw new Error('Invalid refresh token response');
        }

        const accessTokenPreview = `${tokenData.accessToken.substring(0, 10)}...`;
        logDebug(`Received new access token: ${accessTokenPreview}`);

        await saveItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.accessToken);
        logDebug('New access token stored securely');

        return tokenData;
      } catch (error) {
        logError('Token refresh failed', error);
        throw new Error('Failed to refresh authentication token. Please login again.');
      }
    });
  },

  getCurrentUser: async (): Promise<User> => {
    logDebug('Fetching current user profile');

    return measureRequestTime('Get current user request', async () => {
      try {
        const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const tokenPreview = token ? `${token.substring(0, 10)}...` : 'none';
        logDebug(`Using access token: ${tokenPreview}`);

        const response = await apiClient.get('/users/me');
        
        // Check if we have a valid response
        if (!response || !response.data) {
          throw new Error('Réponse du serveur vide ou invalide');
        }
        
        // Use utility function to extract data regardless of response format
        const userData = extractApiData<User>(response);

        // Validate user data
        if (!userData || !userData.id) {
          throw new Error('Données utilisateur manquantes ou invalides');
        }

        logDebug('User profile fetched successfully', {
          id: userData.id,
          email: userData.email,
          role: userData.role,
        });

        try {
          // Update stored user information
          await saveItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          logDebug('User profile saved to secure storage');
        } catch (storageError) {
          logError('Failed to save user profile to storage', storageError);
          // Continue anyway - don't fail the getCurrentUser request because of storage issues
        }

        return userData;
      } catch (error) {
        // Check if it's a token error
        if (error.response?.status === 401 || error.message?.includes('expirée')) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } 
        // Check if it's a network error
        else if (!error.response && error.message?.includes('network')) {
          throw new Error(
            'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
          );
        }
        // Check if response exists but has an unexpected format
        else if (error.response?.data && error.response.status !== 200) {
          const errorMessage = error.response.data.message || 'Erreur serveur';
          throw new Error(`Erreur du serveur: ${errorMessage}`);
        }
        // Default error when response data format is unexpected
        else if (error.message?.includes('manquantes') || error.message?.includes('invalide')) {
          throw error; // Rethrow our validation errors
        }
        // Default fallback error
        else {
          console.error('Unexpected error in getCurrentUser:', error);
          throw new Error('Impossible de récupérer votre profil. Veuillez réessayer plus tard.');
        }
      }
    });
  },

  // Add a network diagnostic method to help with troubleshooting
  testConnection: async (): Promise<{ status: string; details: Record<string, unknown> }> => {
    logDebug('Running AUTH API connection test');
    
    // Log current API configuration
    logApiConfig();
    
    return measureRequestTime('API connection test', async () => {
      try {
        // Test basic connectivity using the centralized API client
        const response = await apiClient.get('/health');

        return {
          status: 'success',
          details: {
            serverResponse: response.data,
            apiUrl: API_URL,
            usingProduction: API_CONFIG.USING_PRODUCTION,
            hostUri: require('expo-constants').default.expoConfig?.hostUri || 'N/A',
            platform: Platform.OS,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error) {
        return {
          status: 'error',
          details: {
            message: error.message,
            apiUrl: API_URL,
            usingProduction: API_CONFIG.USING_PRODUCTION,
            hostUri: require('expo-constants').default.expoConfig?.hostUri || 'N/A',
            platform: Platform.OS,
            networkError: !error.response,
            statusCode: error.response?.status,
            serverMessage: error.response?.data,
            timestamp: new Date().toISOString(),
          },
        };
      }
    });
  }
};

export default authApi;
