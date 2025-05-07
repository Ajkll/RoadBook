// client/app/services/api/client.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { getItem, STORAGE_KEYS } from '../secureStorage';
import Constants from 'expo-constants';
import { logger } from '../../utils/logger';

// ===== CONFIGURATION URLs =====
// URLs de base pour différents environnements
const LOCALHOST_API = 'http://localhost:4002/api';
const ANDROID_EMULATOR_API = 'http://10.0.2.2:4002/api';
const GITHUB_CODESPACE_URL =
  'https://yanstart-rainy-space-5rgx6q6xqpw367r5-4002.preview.app.github.dev/api';

// ===== NGROK CONFIG =====
// IMPORTANT: Remplace cette URL par ton URL ngrok active
// Exécute ngrok http 4002 dans un terminal et copie l'URL fournie ici
const NGROK_URL = 'https://1234-abc-test.ngrok.io/api'; // REMPLACE CETTE URL!

// ===== CONFIGURATION GLOBALE =====
// Définir FORCE_NGROK = true pour utiliser ngrok systématiquement
// C'est l'option la plus fiable pour les tests sur appareil physique
const FORCE_NGROK = true;

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
  // Si FORCE_NGROK est activé, toujours utiliser ngrok (option la plus fiable)
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
      // Sur appareils physiques, utiliser ngrok ou Codespace selon la configuration
      if (FORCE_NGROK) {
        console.log('📱 Using NGROK URL for physical device:', NGROK_URL);
        return NGROK_URL;
      } else {
        console.log('📱 Using Codespace URL for physical device:', GITHUB_CODESPACE_URL);
        return GITHUB_CODESPACE_URL;
      }

    default:
      // En cas de doute, utiliser ngrok comme solution de repli
      console.log('⚠️ Unknown environment, using NGROK URL as fallback');
      return NGROK_URL;
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
  USING_NGROK: FORCE_NGROK || getApiUrl() === NGROK_URL,
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
    }

    const enhancedError = new Error(errorMessage) as ErrorWithDetails;
    enhancedError.originalError = error;
    enhancedError.response = error.response;

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
