// client/app/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth.types';
import { authApi } from '../services/api/auth.api';
import {
  getAuthData,
  clearAuthData,
  saveItem,
  saveAuthData,
  STORAGE_KEYS,
} from '../services/secureStorage';
import { logger } from '../utils/logger';
import { authEvents } from '../services/api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  clearError: () => void;
  handleTokenError: (error: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Flag to bypass login for development purposes - DÉSACTIVÉ
  const bypassLogin = false; // Désactivé pour forcer l'authentification
  
  // Listen for auth failure events using EventEmitter
  useEffect(() => {
    const handleAuthFailure = () => {
      logger.warn('Auth failure event received in AuthContext');
      if (isMounted.current) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        setUser(null);
      }
    };
    
    // Add event listener using EventEmitter
    authEvents.on('auth:failure', handleAuthFailure);
    
    return () => {
      isMounted.current = false;
      // Remove event listener on cleanup
      authEvents.off('auth:failure', handleAuthFailure);
    };
  }, []);

  // Effet pour charger l'utilisateur depuis le stockage sécurisé au démarrage
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        // Initialiser le stockage sécurisé au démarrage
        // Importer de manière dynamique pour éviter les problèmes de dépendances circulaires
        const { initializeSecureStorage, diagnoseStorage } = await import('../services/secureStorage');
        
        // Vérifier et initialiser le stockage
        try {
          const storageStatus = await initializeSecureStorage();
          console.log(`Storage initialization: ${storageStatus.success ? 'SUCCESS' : 'FAILED'}`);
          console.log(`Using storage type: ${storageStatus.storageType}`);
          
          if (!storageStatus.success) {
            logger.error(`Storage initialization failed: ${storageStatus.reason}`);
            
            // En cas d'échec, effectuer un diagnostic complet
            const diagnosticResult = await diagnoseStorage();
            logger.error('Storage diagnostic:', diagnosticResult);
            
            // Alerte l'utilisateur si nous sommes en mode production
            if (process.env.NODE_ENV === 'production') {
              console.log('WARNING: Secure storage initialization failed. Using fallback storage mechanism.');
            }
          }
        } catch (storageInitError) {
          logger.error('Storage initialization error:', storageInitError);
        }
        
        // Bypass désactivé pour forcer l'authentification réelle
        /*
        if (bypassLogin) {
          console.log('Bypassing login for development...');
          const mockUser = { email: 'devuser@example.com', name: 'Dev User' }; // Mock user for dev
          setUser(mockUser); // Set mock user
          setIsLoading(false);
          return;
        }
        */

        console.log('Loading user data from secure storage...');
        const { user, accessToken } = await getAuthData();

        if (user && accessToken) {
          console.log('Found stored user data:', user.email);
          console.log('Setting user state without token validation');
          setUser(user);
        } else {
          console.log('No stored user data found');
        }
      } catch (err) {
        logger.error('Error loading user from storage:', err);
        try {
          await clearAuthData();
        } catch (clearError) {
          logger.error('Failed to clear auth data after load error:', clearError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  /**
   * Fonction de connexion
   * Authentifie l'utilisateur via l'API et met à jour l'état d'authentification
   */
  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      // Bypass désactivé pour forcer l'authentification réelle
      /*
      if (bypassLogin) {
        console.log('Bypassing login for development...');
        const mockUser = { email: 'devuser@example.com', name: 'Dev User' }; // Mock user for dev
        setUser(mockUser); // Set mock user
        setIsLoading(false);
        return;
      }
      */

      console.log('Sending login request:', credentials.email);

      // Valider les identifiants basiques
      if (!credentials.email || !credentials.password) {
        setError('Email et mot de passe requis');
        return;
      }

      // Appeler l'API de connexion
      const response = await authApi.login(credentials);
      console.log('Login successful:', response);

      // Stocker les données d'authentification
      await saveAuthData(response.accessToken, response.refreshToken, response.user);

      // Mettre à jour l'état d'authentification
      setUser(response.user);

      return response;
    } catch (err) {
      logger.error('Login error:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Échec de connexion';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fonction d'inscription
   * Envoie les données utilisateur au serveur et gère la réponse
   */
  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Sending registration data to server:', userData);

      const response = await authApi.register(userData);
      console.log('Registration successful:', response);

      await saveAuthData(response.accessToken, response.refreshToken, response.user);

      setUser(response.user);

      return response;
    } catch (err) {
      logger.error('Registration error:', err);

      const errorMessage = err.response?.data?.message || err.message || "Échec d'inscription";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user logout
   * Clears authentication session data and redirects to login
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('==== LOGOUT ATTEMPT ====');

      // First try to invalidate the session on the server
      try {
        // Skip the getItem call that was causing issues and use the authApi directly
        // It has its own error handling for missing tokens
        console.log('Attempting to invalidate session on server');
        await authApi.logout();
        console.log('Server logout successful');
      } catch (serverError) {
        logger.error('Server logout failed:', serverError);
        console.log('Continuing with client-side logout despite server error');
      }

      // Then clear local auth data regardless of server success/failure
      try {
        console.log('Clearing authentication data from secure storage');
        await clearAuthData();
        console.log('Authentication data cleared successfully');
      } catch (storageError) {
        logger.error('Error clearing auth data from storage:', storageError);
        // Try to clear individual items if the complete clear fails
        try {
          // Execute each operation individually to maximize chances of success
          try { await saveItem(STORAGE_KEYS.ACCESS_TOKEN, ''); } 
          catch (e) { logger.error('Failed to clear ACCESS_TOKEN:', e); }
          
          try { await saveItem(STORAGE_KEYS.REFRESH_TOKEN, ''); } 
          catch (e) { logger.error('Failed to clear REFRESH_TOKEN:', e); }
          
          try { await saveItem(STORAGE_KEYS.USER, ''); } 
          catch (e) { logger.error('Failed to clear USER:', e); }
          
          console.log('Fallback clearing of auth data succeeded');
        } catch (fallbackError) {
          logger.error('Even fallback clearing failed:', fallbackError);
        }
      }

      // Always reset the user state
      console.log('Resetting user state');
      setUser(null);

    } catch (err) {
      logger.error('==== LOGOUT ERROR ====', err);
      
      // Always make sure to clear auth data and user state, even on errors
      try {
        await clearAuthData();
      } catch {}
      
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      console.log('Refreshing user profile data');

      const updatedUser = await authApi.getCurrentUser();
      
      // Update the user state regardless of storage success
      setUser(updatedUser);
      console.log('User data refreshed successfully');
      return updatedUser;
    } catch (err) {
      logger.error('Error refreshing user data:', err);
      
      // Check if this is a token error
      if (err?.isRefreshError || 
          (err?.originalError?.response?.status === 401) ||
          (err?.response?.status === 401) ||
          err.message?.includes('Session expirée')) {
            
        logger.warn('Token expired while refreshing user data, logging out');
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        
        try {
          // Attempt graceful logout
          await logout();
        } catch (logoutError) {
          logger.error('Error during auto-logout:', logoutError);
          // Force state reset as a last resort
          setUser(null);
          await clearAuthData().catch(e => logger.error('Failed to clear auth data:', e));
        }
      }
      
      // Rethrow the error so callers can handle it
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh access token');
      const response = await authApi.refreshToken();

      // Strict validation of response format
      if (response && typeof response === 'object') {
        if (response.accessToken && typeof response.accessToken === 'string') {
          console.log('New access token received');
          // Safe storage of token - saveItem now handles null/undefined
          await saveItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
          return true;
        } else {
          logger.error('Invalid access token in refresh response:', 
            response.accessToken === undefined ? 'undefined' : 
            response.accessToken === null ? 'null' : 
            typeof response.accessToken);
        }
      } else {
        logger.error('Invalid response format from refreshToken:', 
          response === undefined ? 'undefined' : 
          response === null ? 'null' : 
          typeof response);
      }
      
      return false;
    } catch (err) {
      logger.error('Token refresh failed:', err);
      return false;
    }
  };

  const clearError = () => setError(null);

  /**
   * Handle token-related errors
   * This function is especially useful when an API request fails due to token issues
   */
  const handleTokenError = async (error: any) => {
    try {
      // Check if this is a token-related error
      if (error?.isRefreshError || 
          (error?.originalError?.response?.status === 401) ||
          (error?.response?.status === 401)) {
        
        logger.warn('Token error detected, logging out user');
        
        // If it's a refresh error, we should logout the user
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        await logout();
        
        return;
      }
      
      // If it's not a token error, just set the general error
      const errorMessage = error.message || 'Une erreur est survenue';
      setError(errorMessage);
    } catch (err) {
      logger.error('Error handling token error:', err);
      setError('Problème d\'authentification. Veuillez vous reconnecter.');
      await logout();
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    register,
    logout,
    refreshUserData,
    refreshToken,
    clearError,
    handleTokenError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};