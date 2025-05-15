// client/app/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  // Flag to bypass login for development purposes - DÉSACTIVÉ
  const bypassLogin = false; // Désactivé pour forcer l'authentification

  // Effet pour charger l'utilisateur depuis le stockage sécurisé au démarrage
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
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
        await clearAuthData();
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

      try {
        const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          console.log('Attempting to invalidate session on server');
          await authApi.logout();
          console.log('Server logout successful');
        } else {
          console.log('No refresh token found, skipping server logout');
        }
      } catch (serverError) {
        logger.error('Server logout failed:', serverError);
        console.log('Continuing with client-side logout despite server error');
      }

      try {
        console.log('Clearing authentication data from secure storage');
        await clearAuthData();
        console.log('Authentication data cleared successfully');
      } catch (storageError) {
        logger.error('Error clearing auth data from storage:', storageError);
      }

      console.log('Resetting user state');
      setUser(null);

    } catch (err) {
      logger.error('==== LOGOUT ERROR ====', err);

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
      setUser(updatedUser);
      console.log('User data refreshed successfully');
    } catch (err) {
      logger.error('Error refreshing user data:', err);
      
      // Check if this is a token error
      if (err?.isRefreshError || 
          (err?.originalError?.response?.status === 401) ||
          (err?.response?.status === 401) ||
          err.message?.includes('Session expirée')) {
            
        logger.warn('Token expired while refreshing user data, logging out');
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        await logout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh access token');
      const response = await authApi.refreshToken();

      if (response && response.accessToken) {
        console.log('New access token received');
        await saveItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        return true;
      } else {
        logger.error('No access token in refresh response');
        return false;
      }
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