// client/app/services/api/client.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { getItem, saveItem, clearAuthData, STORAGE_KEYS } from '../secureStorage';
import Constants from 'expo-constants';
import { logger } from '../../utils/logger';

// ===== CONFIGURATION URLs =====
// URLs de base pour différents environnements
const LOCALHOST_API = 'http://localhost:4002/api';
const ANDROID_EMULATOR_API = 'http://10.0.2.2:4002/api';
const GITHUB_CODESPACE_URL =
  'https://yanstart-rainy-space-5rgx6q6xqpw367r5-4002.preview.app.github.dev/api';

// URL de l'API de production (déployée sur Render)
const PRODUCTION_API = 'https://roadbook-backend.onrender.com/api';

// ===== NGROK CONFIG =====
// IMPORTANT: Remplace cette URL par ton URL ngrok active
// Exécute ngrok http 4002 dans un terminal et copie l'URL fournie ici
const NGROK_URL = 'https://1234-abc-test.ngrok.io/api'; // REMPLACE CETTE URL!

// ===== CONFIGURATION GLOBALE =====
// Définir FORCE_PRODUCTION = true pour utiliser l'API de production systématiquement
// Définir FORCE_NGROK = true pour utiliser ngrok systématiquement en développement
// C'est l'option la plus fiable pour les tests sur appareil physique
const FORCE_PRODUCTION = true;
const FORCE_NGROK = false;

// ===== DÉTECTION D'ENVIRONNEMENT =====
// Fonction améliorée pour détecter le type d'environnement
const detectEnvironment = () => {
  let environment = 'unknown';
  let explanation = '';

  try {
    // Pour les tests manuels, décommenter cette ligne:
    // return { environment: 'physical', explanation: 'Manually forced' };

    // Détection basée sur la plateforme et les constantes Expo
    if (Platform.OS === 'web') {
      environment = 'web';
      explanation = 'Platform.OS === web';
    } else if (!Constants.isDevice && Platform.OS === 'ios') {
      environment = 'ios-simulator';
      explanation = 'iOS simulator detected';
    } else if (!Constants.isDevice && Platform.OS === 'android') {
      environment = 'android-emulator';
      explanation = 'Android emulator detected';
    } else {
      environment = 'physical';
      explanation = 'Physical device or expo tunnel detected';
    }

    console.log(`🔍 Environment detected: ${environment} (${explanation})`);
    return { environment, explanation };
  } catch (e) {
    logger.error('❌ Error detecting environment:', e);
    // Par défaut, on considère qu'on est sur un appareil physique
    return { environment: 'physical', explanation: 'Detection error, assuming physical device' };
  }
};

// ===== SÉLECTION DE L'URL DE L'API =====
// Choisit l'URL appropriée en fonction de l'environnement
const getApiUrl = () => {
  // Si FORCE_PRODUCTION est activé, toujours utiliser l'API de production
  if (FORCE_PRODUCTION) {
    console.log('🌍 Using PRODUCTION API URL (forced):', PRODUCTION_API);
    return PRODUCTION_API;
  }
  
  // Si FORCE_NGROK est activé, toujours utiliser ngrok (option pour le développement)
  if (FORCE_NGROK) {
    console.log('🌍 Using NGROK URL (forced):', NGROK_URL);
    return NGROK_URL;
  }

  // Sinon, déterminer l'URL en fonction de l'environnement
  const { environment } = detectEnvironment();

  switch (environment) {
    case 'web':
      console.log('🌐 Using localhost for web development');
      return LOCALHOST_API;

    case 'ios-simulator':
      console.log('🍎 Using localhost for iOS simulator');
      return LOCALHOST_API;

    case 'android-emulator':
      console.log('🤖 Using 10.0.2.2 for Android emulator');
      return ANDROID_EMULATOR_API;

    case 'physical':
      // Sur appareils physiques, utiliser API de production, ngrok ou Codespace selon la configuration
      if (FORCE_PRODUCTION) {
        console.log('📱 Using PRODUCTION API for physical device:', PRODUCTION_API);
        return PRODUCTION_API;
      } else if (FORCE_NGROK) {
        console.log('📱 Using NGROK URL for physical device:', NGROK_URL);
        return NGROK_URL;
      } else {
        console.log('📱 Using Codespace URL for physical device:', GITHUB_CODESPACE_URL);
        return GITHUB_CODESPACE_URL;
      }

    default:
      // En cas de doute, utiliser l'API de production comme solution de repli
      console.log('⚠️ Unknown environment, using PRODUCTION API as fallback');
      return PRODUCTION_API;
  }
};

// ===== EXPORT DES CONFIGURATIONS =====
// Créer un objet de configuration pour faciliter la référence ailleurs
const env = detectEnvironment();
export const API_CONFIG = {
  API_URL: getApiUrl(),
  ENVIRONMENT: env.environment,
  ENVIRONMENT_DETAIL: env.explanation,
  IS_PHYSICAL_DEVICE: env.environment === 'physical',
  IS_EMULATOR: env.environment === 'android-emulator' || env.environment === 'ios-simulator',
  IS_WEB: env.environment === 'web',
  USING_PRODUCTION: FORCE_PRODUCTION || getApiUrl() === PRODUCTION_API,
  USING_NGROK: FORCE_NGROK || getApiUrl() === NGROK_URL,
  PRODUCTION_API,
  NGROK_URL,
  GITHUB_CODESPACE_URL,
};

// Exports pour la compatibilité avec le code existant
export const API_URL = API_CONFIG.API_URL;
export const CODESPACE_BASE_URL = GITHUB_CODESPACE_URL;
export const TUNNEL_MODE = API_CONFIG.IS_PHYSICAL_DEVICE;
const DEBUG = true;

// Loguer la configuration finale
console.log('🔧 API CLIENT CONFIGURATION:');
console.log('🔧 API URL:', API_URL);
console.log('🔧 Environment:', API_CONFIG.ENVIRONMENT);
console.log('🔧 Using NGROK:', API_CONFIG.USING_NGROK ? 'YES' : 'NO');
console.log('🔧 Platform:', Platform.OS);

// ===== CRÉATION DU CLIENT AXIOS =====
// Créer une instance axios configurée
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 secondes
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Environment': API_CONFIG.ENVIRONMENT,
  },
  withCredentials: true, // Pour les cookies
});

// ===== INTERCEPTEURS DE REQUÊTE =====
// Ajouter le token d'authentification aux requêtes
apiClient.interceptors.request.use(
  async (config) => {
    // Ajouter le token au header
    const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (DEBUG) {
      console.log(`🔶 REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`🔶 REQUEST HEADERS:`, config.headers);
      if (config.data) {
        const safeData = { ...config.data };
        if (safeData.password) safeData.password = '***HIDDEN***';
        console.log(`🔶 REQUEST DATA:`, safeData);
      }
    }

    return config;
  },
  (error) => {
    logger.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ===== INTERCEPTEURS DE RÉPONSE =====
// Gérer les erreurs et les réponses

// Variable to track if a token refresh is in progress
let isRefreshingToken = false;
// Queue of requests to retry after token refresh
let requestsQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
  config: any;
}> = [];

// Process requests queue with new token
const processQueue = (error: any = null, newToken: string | null = null) => {
  requestsQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      // Update the Authorization header with the new token
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
      }
      // Retry the request with the updated config
      resolve(axios(config));
    }
  });
  // Clear the queue
  requestsQueue = [];
};

// Global event emitter for auth events
import { EventEmitter } from 'events';
export const authEvents = new EventEmitter();

// Create a custom event for token refresh failures
// This allows components to listen for auth failures and respond accordingly
export const createAuthFailureEvent = () => {
  // Use EventEmitter instead of DOM events
  authEvents.emit('auth:failure', { 
    message: 'Authentication failed, please login again' 
  });
  
  logger.warn('Auth failure event emitted');
};

apiClient.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(`🔷 RESPONSE: ${response.status} from ${response.config.url}`);
      console.log(`🔷 RESPONSE DATA:`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    logger.error('Response interceptor error:', error.message);

    // Get the original request config
    const originalRequest = error.config as AxiosRequestConfig;
    
    // Check if the error is due to an expired token (status 401)
    // Also make sure we're not already trying to refresh the token and this isn't a token refresh request
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._isRetry &&
      !originalRequest.url?.includes('refresh-token') &&
      !isRefreshingToken
    ) {
      // Mark that we're in the process of refreshing the token
      isRefreshingToken = true;
      // Mark this request to avoid infinite retry loops
      originalRequest._isRetry = true;

      logger.info('Token expired, attempting to refresh...');

      // Create a new promise that will be resolved when the token is refreshed
      return new Promise((resolve, reject) => {
        // Add to queue of requests to retry after token refresh
        requestsQueue.push({ resolve, reject, config: originalRequest });

        // Try to refresh the token
        getItem(STORAGE_KEYS.REFRESH_TOKEN)
          .then(refreshToken => {
            if (!refreshToken) {
              logger.error('No refresh token available');
              processQueue(new Error('No refresh token available'));
              isRefreshingToken = false;
              return;
            }

            // Call the token refresh function
            return axios.post(`${API_URL}/auth/refresh-token`, { refreshToken })
              .then(response => {
                const newToken = response.data.data?.accessToken || response.data.accessToken;
                if (!newToken) {
                  throw new Error('Invalid refresh token response');
                }

                // Save the new token
                saveItem(STORAGE_KEYS.ACCESS_TOKEN, newToken)
                  .then(() => {
                    logger.info('Token refreshed successfully');
                    
                    // Update Authorization header for future requests
                    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    
                    // Process all queued requests with the new token
                    processQueue(null, newToken);
                    isRefreshingToken = false;
                  });
              })
              .catch(refreshError => {
                logger.error('Token refresh failed:', refreshError);
                // Process all queued requests with the error
                processQueue(refreshError);
                isRefreshingToken = false;
                
                // Clean up auth data since the refresh token is likely invalid
                clearAuthData()
                  .then(() => {
                    // Notify the app that authentication has failed
                    createAuthFailureEvent();
                  });
              });
          });
      });
    }

    // Logguer les informations d'erreur détaillées
    if (error.response) {
      logger.error(`Server responded with status ${error.response.status}`);
      logger.error('Response data:', error.response.data);
    } else if (error.request) {
      logger.error('No response received:', error.request);
    } else {
      logger.error('Error setting up request:', error.message);
    }

    // Extraire et créer une erreur plus conviviale
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

    if (error.response) {
      // Le serveur a répondu avec un statut d'erreur
      errorMessage = error.response.data?.message || `Erreur serveur (${error.response.status})`;
    } else if (error.request) {
      // Pas de réponse du serveur
      errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
    } else {
      // Erreur dans la configuration de la requête
      errorMessage = 'Erreur de configuration de la requête.';
    }

    interface ErrorWithDetails extends Error {
      originalError: AxiosError;
      response: unknown;
      isRefreshError?: boolean;
    }

    const enhancedError = new Error(errorMessage) as ErrorWithDetails;
    enhancedError.originalError = error;
    enhancedError.response = error.response;
    
    // Check if this is a refresh token error (could be useful for redirecting to login)
    if (error.response?.status === 401 && (error.config?.url?.includes('refresh-token') || isRefreshingToken)) {
      enhancedError.isRefreshError = true;
    }

    return Promise.reject(enhancedError);
  }
);

// ===== FONCTIONS UTILITAIRES =====
// Fonction de test de connexion API pour le débogage
export const testApiConnection = async () => {
  try {
    // Toujours utiliser la dernière URL d'API en référençant la constante API_URL exportée
    console.log('🔍 Testing API connection to:', API_URL);
    console.log('🔍 Environment:', API_CONFIG.ENVIRONMENT);

    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000,
      headers: {
        Accept: 'application/json',
        'X-Client-Platform': Platform.OS,
        'X-Client-Environment': API_CONFIG.ENVIRONMENT,
      },
    });

    console.log('✅ API connection successful:', response.status);
    return {
      success: true,
      status: response.status,
      data: response.data,
      apiUrl: API_URL,
      environment: API_CONFIG.ENVIRONMENT,
      platform: Platform.OS,
      hostUri: Constants.expoConfig?.hostUri || 'N/A',
    };
  } catch (error) {
    logger.error('❌ API connection failed:', error);
    return {
      success: false,
      message: error.message,
      error: error,
      apiUrl: API_URL,
      environment: API_CONFIG.ENVIRONMENT,
      platform: Platform.OS,
      hostUri: Constants.expoConfig?.hostUri || 'N/A',
    };
  }
};

export default apiClient;
