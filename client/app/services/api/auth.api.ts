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
import { saveAuthData, getItem, clearAuthData, STORAGE_KEYS, saveItem } from '../secureStorage';
import apiClient, { API_URL, API_CONFIG } from './client'; // Import our central API client and configuration
import { logger } from '../../utils/logger';
import { extractApiData, extractErrorMessage } from './utils';

// Log API configuration for debugging only in development mode
if (__DEV__) {
  console.log('🔄 AUTH API: Using URL from central API client:', API_URL);
  console.log('🔄 AUTH API: Using production API:', API_CONFIG.USING_PRODUCTION ? 'Yes' : 'No');
}

// Debug flag - easily toggle detailed logging
const DEBUG = false;

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

  // Log error object details to help with debugging
  logger.error('Error object details:', JSON.stringify(error));

  // Extract and log additional error details if available
  if (error.response) {
    logger.error('- Status:', error.response.status);
    logger.error('- Data:', JSON.stringify(error.response.data));
    logger.error('- Headers:', JSON.stringify(error.response.headers));
  } else if (error.request) {
    logger.error('- Request was made but no response received');
    logger.error('- Request:', JSON.stringify(error.request));
  } else {
    logger.error('- Error message:', error.message);
  }

  // Log network information if available
  if (error.config) {
    logger.error('- Request URL:', error.config.url);
    logger.error('- Request Method:', error.config.method?.toUpperCase());
    logger.error('- Request Headers:', JSON.stringify(error.config.headers));

    // Don't log sensitive data in production, but helpful for debugging
    if (error.config.data) {
      try {
        // Attempt to parse and sanitize sensitive data
        const configData = JSON.parse(error.config.data);
        const sanitizedData = { ...configData };
        if (sanitizedData.password) sanitizedData.password = '******';
        if (sanitizedData.currentPassword) sanitizedData.currentPassword = '******';
        if (sanitizedData.newPassword) sanitizedData.newPassword = '******';
        logger.error('- Request Data (sanitized):', JSON.stringify(sanitizedData));
      } catch (e) {
        logger.error('- Request Data: [Could not parse]', error.config.data);
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
        // Use only the /auth/register endpoint since /users is not available
        const response = await apiClient.post('/auth/register', data);
        const authData = extractApiData<AuthResponse>(response);
        logDebug('Server response for registration:', authData);
        return authData;
      } catch (error) {
        logError('Registration failed', error);
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

        // Utilisation de l'endpoint spécifié dans la documentation de l'API
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
  
  // Mise à jour du profil utilisateur
  updateUserProfile: async (userData: Partial<User>): Promise<User> => {
    logDebug('Updating user profile');

    return measureRequestTime('Update user profile request', async () => {
      try {
        // Utilisation de l'endpoint spécifié dans la documentation de l'API
        const response = await apiClient.put('/users/me', userData);
        
        if (!response || !response.data) {
          throw new Error('Réponse du serveur vide ou invalide');
        }
        
        const updatedUserData = extractApiData<User>(response);

        if (!updatedUserData || !updatedUserData.id) {
          throw new Error('Données utilisateur mises à jour manquantes ou invalides');
        }

        logDebug('User profile updated successfully', {
          id: updatedUserData.id,
          displayName: updatedUserData.displayName,
        });

        // Mettre à jour les informations stockées
        try {
          // Récupérer d'abord les données actuelles
          const currentUserJson = await getItem(STORAGE_KEYS.USER);
          if (currentUserJson) {
            const currentUser = JSON.parse(currentUserJson);
            // Fusionner les données actuelles avec les données mises à jour
            const mergedUser = { ...currentUser, ...updatedUserData };
            await saveItem(STORAGE_KEYS.USER, JSON.stringify(mergedUser));
            logDebug('Updated user profile saved to secure storage');
          } else {
            await saveItem(STORAGE_KEYS.USER, JSON.stringify(updatedUserData));
          }
        } catch (storageError) {
          logError('Failed to save updated user profile to storage', storageError);
        }

        return updatedUserData;
      } catch (error) {
        if (error.response?.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response?.status === 400) {
          const errorMessage = error.response.data.message || 'Données de profil invalides';
          throw new Error(errorMessage);
        } else if (!error.response) {
          throw new Error(
            'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
          );
        } else {
          throw new Error('La mise à jour du profil a échoué. Veuillez réessayer plus tard.');
        }
      }
    });
  },
  
  // Changement de mot de passe
  changePassword: async (currentPassword: string, newPassword: string, confirmPassword?: string): Promise<void> => {
    logDebug('Changing user password');

    // Validation des paramètres pour éviter les erreurs côté serveur
    if (!currentPassword || typeof currentPassword !== 'string') {
      throw new Error('Le mot de passe actuel est requis');
    }
    
    if (!newPassword || typeof newPassword !== 'string') {
      throw new Error('Le nouveau mot de passe est requis');
    }
    
    // Si confirmPassword n'est pas fourni, utiliser newPassword comme valeur par défaut
    const confirmPasswordToUse = confirmPassword || newPassword;

    return measureRequestTime('Change password request', async () => {
      try {
        // Log détaillé des données envoyées (masquées)
        logDebug('Password change request data:', {
          currentPassword: '********',
          newPassword: '********',
          confirmPassword: '********',
          currentPasswordType: typeof currentPassword,
          newPasswordType: typeof newPassword,
          confirmPasswordType: typeof confirmPasswordToUse,
          currentPasswordLength: currentPassword.length,
          newPasswordLength: newPassword.length
        });
        
        // Préparer l'objet de données avec tous les champs requis
        const passwordData = {
          currentPassword,
          newPassword,
          confirmPassword: confirmPasswordToUse
        };
        
        // Utiliser directement l'endpoint /users/me/password qui est le bon endpoint
        const response = await apiClient.put('/users/me/password', passwordData);
        
        logDebug('Password changed successfully', response.data);
      } catch (error) {
        // Log détaillé de l'erreur
        logError('Password change request failed', error);
        
        if (error.response?.status === 401) {
          throw new Error('Mot de passe actuel incorrect.');
        } else if (error.response?.status === 400) {
          // Vérifier si l'erreur concerne le champ confirmPassword manquant
          if (error.response?.data?.errors && 
              error.response.data.errors.some(e => e.path && e.path.includes('confirmPassword'))) {
            throw new Error('La confirmation du mot de passe est requise.');
          }
          
          // Extraction du message d'erreur spécifique du serveur
          const errorMessage = extractErrorMessage(error) || 'Données de mot de passe invalides';
          throw new Error(errorMessage);
        } else if (!error.response) {
          throw new Error(
            'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
          );
        } else {
          throw new Error('Le changement de mot de passe a échoué. Veuillez réessayer plus tard.');
        }
      }
    });
  },
  
  // Obtenir les sessions actives de l'utilisateur
  getUserSessions: async (): Promise<any[]> => {
    logDebug('Fetching user sessions');

    // Fonction pour générer des données de session simulées
    const getMockSessions = () => {
      logDebug('Returning mock sessions data');
      const deviceInfo = Platform.OS === 'ios' ? 'iPhone' : Platform.OS === 'android' ? 'Android' : 'Appareil';
      return [{
        id: 'session-current',
        device: `${deviceInfo} actuel`,
        location: 'Emplacement actuel',
        lastActive: new Date().toISOString(),
        current: true
      }];
    };

    try {
      // Récupérer l'ID de l'utilisateur actuel
      const userJson = await getItem(STORAGE_KEYS.USER);
      if (!userJson) {
        logDebug('No user found in storage, returning mock data');
        return getMockSessions();
      }
      
      const user = JSON.parse(userJson);
      
      try {
        // Tentative d'utilisation de l'endpoint API - NO MEASUREMENT to reduce logs
        logDebug(`Attempting to fetch sessions for user ${user.id}`);
        const response = await apiClient.get(`/users/${user.id}/sessions`);
        
        if (!response || !response.data) {
          logDebug('Empty response from server, using mock data');
          return getMockSessions();
        }
        
        const sessions = extractApiData<any[]>(response);
        logDebug(`${sessions.length} user sessions fetched successfully`);
        return sessions;
      } catch (apiError) {
        // Si l'endpoint n'existe pas (404) ou autre erreur, utilisez des données simulées
        logDebug(`API error: ${apiError.message}, status: ${apiError.response?.status}`);
        
        if (apiError.response?.status === 404) {
          logDebug('Sessions API endpoint returned 404, using mock data');
          return getMockSessions();
        } else {
          logDebug('Other API error, using mock data');
          return getMockSessions();
        }
      }
    } catch (error) {
      // En cas d'erreur quelconque, retourner des données simulées au lieu de lever une exception
      logDebug(`Unexpected error in getUserSessions: ${error.message}`);
      return getMockSessions();
    }
  },
  
  // Révoquer une session spécifique
  revokeSession: async (sessionId: string): Promise<void> => {
    logDebug(`Revoking session: ${sessionId}`);

    return measureRequestTime('Revoke session request', async () => {
      try {
        // Utilisation d'un endpoint hypothétique qui n'est pas explicitement dans la documentation
        // Nous pourrions avoir besoin d'ajuster cela selon l'implémentation réelle de l'API
        await apiClient.delete(`/auth/sessions/${sessionId}`);
        
        logDebug('Session successfully revoked');
      } catch (error) {
        if (error.response?.status === 401) {
          throw new Error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response?.status === 404) {
          throw new Error('Session introuvable ou déjà révoquée.');
        } else if (!error.response) {
          throw new Error(
            'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
          );
        } else {
          throw new Error('Impossible de révoquer la session. Veuillez réessayer plus tard.');
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
  },
  
  // Demander une réinitialisation de mot de passe
  requestPasswordReset: async (email: string): Promise<void> => {
    logDebug('Requesting password reset');

    return measureRequestTime('Password reset request', async () => {
      try {
        // Utilisation de l'endpoint pour la réinitialisation de mot de passe
        await apiClient.post('/auth/forgot-password', { email });
        
        logDebug('Password reset requested successfully');
      } catch (error) {
        // Pour des raisons de sécurité, nous ne divulguons pas si l'email existe ou non
        // On simule un succès même en cas d'erreur côté serveur (sauf erreurs réseau)
        if (!error.response) {
          throw new Error(
            'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
          );
        }
        
        // Loggons l'erreur mais n'exposons pas de détails à l'utilisateur
        logError('Password reset request failed', error);
        
        // Ne pas lever d'erreur pour éviter de divulguer si l'email existe ou non
      }
    });
  }
};

export default authApi;
