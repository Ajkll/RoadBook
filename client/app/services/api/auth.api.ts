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

// Environment-specific API URL configuration
const getDevelopmentApiUrl = () => {
  // Using direct IP address instead of localhost
  const SERVER_IP = '127.0.0.1';
  // Use port 4002 for development server, 4001 for test server
  const SERVER_PORT = '4002';
  const TUNNEL_URL = `http://${SERVER_IP}:${SERVER_PORT}/api`;

  // When running on a physical device with Expo Go, we need to use a tunneled URL
  // This could be ngrok, localtunnel, or other service that exposes your localhost
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    // Check if this is a simulator/emulator or a physical device
    // In a real device through Expo Go, we need to use the tunnel URL
    const isDevice = !(__DEV__ && !process.env.EXPO_PUBLIC_USE_PHYSICAL_DEVICE);

    if (isDevice) {
      // On a physical device, use tunnel URL
      console.log('🔄 AUTH API: Using tunnel URL for physical device:', TUNNEL_URL);
      return TUNNEL_URL;
    }
  }

  // For emulators and simulators
  if (Platform.OS === 'android') {
    console.log('🔄 AUTH API: Using Android emulator URL: http://10.0.2.2:4002/api');
    return 'http://10.0.2.2:4002/api'; // Special IP for Android emulator
  } else if (Platform.OS === 'ios') {
    console.log('🔄 AUTH API: Using iOS simulator URL: http://127.0.0.1:4002/api');
    return 'http://127.0.0.1:4002/api'; // For iOS simulator
  }

  // Web version
  console.log('🔄 AUTH API: Using web URL: http://127.0.0.1:4002/api');
  return 'http://127.0.0.1:4002/api';
};

// Configuration API URL
const API_URL = __DEV__ ? getDevelopmentApiUrl() : 'https://your-production-api.com/api';

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
  console.error(`❌ AUTH API ERROR: ${message}`, error);

  // Extract and log additional error details if available
  if (error.response) {
    console.error('- Status:', error.response.status);
    console.error('- Data:', error.response.data);
    console.error('- Headers:', error.response.headers);
  } else if (error.request) {
    console.error('- Request was made but no response received');
    console.error('- Request:', error.request);
  } else {
    console.error('- Error message:', error.message);
  }

  // Log network information if available
  if (error.config) {
    console.error('- Request URL:', error.config.url);
    console.error('- Request Method:', error.config.method?.toUpperCase());
    console.error('- Request Headers:', error.config.headers);

    // Don't log sensitive data in production, but helpful for debugging
    if (DEBUG && error.config.data) {
      try {
        // Attempt to parse and sanitize sensitive data
        const configData = JSON.parse(error.config.data);
        const sanitizedData = { ...configData };
        if (sanitizedData.password) sanitizedData.password = '******';
        console.error('- Request Data (sanitized):', sanitizedData);
      } catch {
        console.error('- Request Data: [Could not parse]');
      }
    }
  }
};

// Create Axios instance with enhanced configuration
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Platform': Platform.OS,
    'X-Client-Version': '1.0.0', // Replace with your app version
  },
  withCredentials: true,
  timeout: 15000, // 15 second timeout
});

// Log network timing
const startTime = new Date();
const logNetworkTiming = (response: AxiosResponse) => {
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();
  logDebug(`Request to ${response.config.url} completed in ${duration}ms`);
};

// Request interceptor with enhanced logging
apiClient.interceptors.request.use(
  async (config) => {
    const newStartTime = new Date();
    startTime.setTime(newStartTime.getTime());

    logDebug(`🔼 Outgoing request to: ${config.method?.toUpperCase()} ${config.url}`);

    // Add authentication token if available
    const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logDebug('Token added to request headers');
    } else {
      logDebug('No authentication token available');
    }

    // Log request data (sanitized for security)
    if (DEBUG && config.data) {
      try {
        const requestData = JSON.parse(JSON.stringify(config.data));
        // Sanitize sensitive information
        if (requestData.password) requestData.password = '******';
        logDebug('Request payload (sanitized):', requestData);
      } catch {
        logDebug('Request payload: [Could not stringify]');
      }
    }

    return config;
  },
  (error) => {
    logError('Request preparation failed', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced logging and token refresh
apiClient.interceptors.response.use(
  (response) => {
    logNetworkTiming(response);
    logDebug(
      `🔽 Response received from: ${response.config.method?.toUpperCase()} ${response.config.url}`,
      {
        status: response.status,
        statusText: response.statusText,
        // Only log response data in debug mode and limit its size
        data: DEBUG
          ? JSON.stringify(response.data).length > 500
            ? `${JSON.stringify(response.data).substring(0, 500)}... [truncated]`
            : response.data
          : '[hidden in production]',
      }
    );

    return response;
  },
  async (error) => {
    // Log detailed error information
    logError(
      `Response error for ${error.config?.method?.toUpperCase() || 'UNKNOWN'} ${error.config?.url || 'UNKNOWN'}`,
      error
    );

    const originalRequest = error.config;

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      logDebug('Attempting to refresh access token due to 401 response');
      originalRequest._retry = true;

      try {
        const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (!refreshToken) {
          logDebug('No refresh token available, cannot attempt token refresh');
          throw new Error('No refresh token available');
        }

        logDebug('Calling refresh token endpoint');
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
          logError('Refresh token response missing access token', response.data);
          throw new Error('Invalid refresh token response');
        }

        const newAccessToken = response.data.accessToken;
        logDebug('Successfully obtained new access token');

        await saveItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        logDebug('Retrying original request with new token');
        // Create a fresh copy of the original request
        const newRequest = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
        };

        return apiClient(newRequest);
      } catch (refreshError) {
        logError('Token refresh failed', refreshError);
        await clearAuthData();
        return Promise.reject({
          ...refreshError,
          isRefreshError: true,
          message: 'Session expired. Please login again.',
        });
      }
    }

    // Network connectivity issues
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        logDebug('Request timeout. The server is taking too long to respond.');
        return Promise.reject({
          ...error,
          isNetworkError: true,
          message: 'Request timeout. Please check your connection and try again.',
        });
      }

      logDebug('Network error. No response received from server.');
      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Network error. Please check your connection and try again.',
      });
    }

    return Promise.reject(error);
  }
);

// Enhanced API methods with comprehensive logging
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    console.log('Sending registration data to server:', data);

    try {
      // Improved error logging
      logDebug('Registration attempt with data', {
        email: data.email,
        displayName: data.displayName,
        role: data.role,
      });

      // Send to user API endpoints as that's what the server expects
      // Try both /users and /auth/register endpoints in case one fails
      try {
        // First try /users endpoint
        const response = await apiClient.post<AuthResponse>('/users', data);
        logDebug('Server response for registration:', response.data);
        return response.data;
      } catch (firstError) {
        logError('First registration attempt failed, trying alternate endpoint', firstError);

        // Fallback to /auth/register endpoint
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        logDebug('Server response for registration (fallback endpoint):', response.data);
        return response.data;
      }
    } catch (error) {
      logError('Registration failed after all attempts', error);
      throw error;
    }
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    logDebug('Attempting login', { email: credentials.email });

    try {
      const connectionInfo = `API URL: ${API_URL}`;
      logDebug(`Login endpoint connection info: ${connectionInfo}`);

      const startTime = Date.now();
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      const duration = Date.now() - startTime;

      logDebug(`Login successful in ${duration}ms`, {
        userId: response.data.user.id,
        role: response.data.user.role,
        displayName: response.data.user.displayName,
        tokenReceived: !!response.data.accessToken,
      });

      // Check if response contains expected data
      if (!response.data.accessToken || !response.data.user) {
        logError('Login response missing critical data', response.data);
        throw new Error('Réponse du serveur invalide');
      }

      // Store authentication data securely
      await saveAuthData(response.data.accessToken, response.data.refreshToken, response.data.user);

      logDebug('Authentication data stored securely');
      return response.data;
    } catch (error) {
      logError('Login failed', error);

      // Provide specific error messages based on the server response
      if (error.response?.status === 401) {
        throw new Error('Email ou mot de passe incorrect');
      } else if (error.response?.status === 400) {
        throw new Error('Données de connexion invalides');
      } else if (error.isNetworkError) {
        throw new Error(
          'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
        );
      } else {
        throw new Error('La connexion a échoué. Veuillez réessayer plus tard.');
      }
    }
  },

  logout: async (): Promise<void> => {
    logDebug('Initiating logout process');

    try {
      await apiClient.post('/auth/logout');
      logDebug('Logout request successful');
    } catch (error) {
      logError('Logout request failed', error);
      // Continue with local logout regardless of server error
      logDebug('Proceeding with local logout despite server error');
    } finally {
      await clearAuthData();
      logDebug('Local authentication data cleared');
    }
  },

  refreshToken: async (): Promise<TokenRefreshResponse> => {
    logDebug('Attempting to refresh token');

    try {
      const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);

      if (!refreshToken) {
        logDebug('No refresh token found in storage');
        throw new Error('No refresh token available');
      }

      const tokenPreview = `${refreshToken.substring(0, 10)}...`;
      logDebug(`Using refresh token: ${tokenPreview}`);

      const response = await apiClient.post<TokenRefreshResponse>('/auth/refresh-token', {
        refreshToken,
      });

      if (!response.data.accessToken) {
        logError('Refresh token response missing access token', response.data);
        throw new Error('Invalid refresh token response');
      }

      const accessTokenPreview = `${response.data.accessToken.substring(0, 10)}...`;
      logDebug(`Received new access token: ${accessTokenPreview}`);

      await saveItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
      logDebug('New access token stored securely');

      return response.data;
    } catch (error) {
      logError('Token refresh failed', error);
      throw new Error('Failed to refresh authentication token. Please login again.');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    logDebug('Fetching current user profile');

    try {
      const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const tokenPreview = token ? `${token.substring(0, 10)}...` : 'none';
      logDebug(`Using access token: ${tokenPreview}`);

      const response = await apiClient.get<User>('/users/me');

      logDebug('User profile fetched successfully', {
        id: response.data.id,
        email: response.data.email,
        role: response.data.role,
      });

      // Update stored user information
      await saveItem(STORAGE_KEYS.USER, JSON.stringify(response.data));
      logDebug('User profile saved to secure storage');

      return response.data;
    } catch (error) {
      logError('Failed to fetch user profile', error);

      if (error.response?.status === 401) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      } else if (error.isNetworkError) {
        throw new Error(
          'Problème de connexion réseau. Veuillez vérifier votre connexion internet.'
        );
      } else {
        throw new Error('Impossible de récupérer votre profil. Veuillez réessayer plus tard.');
      }
    }
  },

  // Add a network diagnostic method to help with troubleshooting
  testConnection: async (): Promise<{ status: string; details: Record<string, unknown> }> => {
    logDebug('Running API connection test');

    try {
      // Test basic connectivity
      const startTime = Date.now();
      const response = await apiClient.get('/');
      const pingTime = Date.now() - startTime;

      return {
        status: 'success',
        details: {
          pingTime: `${pingTime}ms`,
          serverResponse: response.data,
          apiUrl: API_URL,
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
          apiUrl: API_URL,
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
