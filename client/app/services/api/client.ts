// client/app/services/api/client.ts
import axios, { AxiosError, AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { getItem, STORAGE_KEYS } from '../secureStorage';

// Configure API URL based on environment
const getApiUrl = () => {
  // Simplified approach using localhost (works for web)
  let baseUrl = 'http://localhost:4000/api';

  // For mobile devices
  if (Platform.OS === 'android') {
    // Special IP for Android emulator to access host
    console.log('Using Android special IP');
    baseUrl = 'http://10.0.2.2:4000/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    console.log('Using iOS localhost');
    baseUrl = 'http://localhost:4000/api';
  }

  console.log(`🔄 CLIENT: Using API URL: ${baseUrl}`);
  return baseUrl;
};

// Create API client config
const API_URL = getApiUrl();
const DEBUG = true; // Always enable debugging

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Platform': Platform.OS,
  },
  withCredentials: true, // For cookies
});

// Request interceptor to add token
apiClient.interceptors.request.use(
  async (config) => {
    // Add token to header
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
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => {
    if (DEBUG) {
      console.log(`🔷 RESPONSE: ${response.status} from ${response.config.url}`);
      console.log(`🔷 RESPONSE DATA:`, response.data);
    }
    return response;
  },
  async (error: AxiosError) => {
    console.error('Response interceptor error:', error.message);

    // Log detailed error info
    if (error.response) {
      console.error(`Server responded with status ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }

    // Extract and create a more user-friendly error
    let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';

    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.message || `Erreur serveur (${error.response.status})`;
    } else if (error.request) {
      // No response from server
      errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion internet.';
    } else {
      // Error setting up request
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

// Test function for debugging
export const testApiConnection = async () => {
  try {
    console.log('🔍 Testing API connection to:', API_URL);
    const response = await axios.get(API_URL, {
      timeout: 5000,
      headers: { Accept: 'application/json' },
    });
    console.log('✅ API connection successful:', response.status);
    return { success: true, status: response.status, data: response.data };
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return {
      success: false,
      message: error.message,
      error: error,
    };
  }
};

export default apiClient;
