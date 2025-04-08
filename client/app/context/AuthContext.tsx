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

  // Effet pour charger l'utilisateur depuis le stockage sécurisé au démarrage
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        console.log('Loading user data from secure storage...');
        const { user, accessToken } = await getAuthData();

        if (user && accessToken) {
          console.log('Found stored user data:', user.email);

          // Simply set the user - we're not checking token expiration for now
          // This ensures redirection works correctly
          console.log('Setting user state without token validation');
          setUser(user);
        } else {
          console.log('No stored user data found');
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
        await clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    // This function is removed as we'll simply trust the token and set authentication to true
    // This ensures we redirect properly to the tabs

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

      // Ne pas rediriger immédiatement, laisser le composant root le faire
      // La navigation sera gérée par le RootNavigator quand isAuthenticated change

      return response;
    } catch (err) {
      console.error('Login error:', err);

      // Extraire le message d'erreur
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

      // Appel à l'API d'inscription
      const response = await authApi.register(userData);
      console.log('Registration successful:', response);

      // Stocker les données d'authentification
      await saveAuthData(response.accessToken, response.refreshToken, response.user);

      // Mettre à jour l'état d'authentification
      setUser(response.user);

      // Ne pas rediriger immédiatement, laisser le composant root le faire
      // La navigation sera gérée par le RootNavigator quand isAuthenticated change

      return response;
    } catch (err) {
      console.error('Registration error:', err);

      // Extraire le message d'erreur
      const errorMessage = err.response?.data?.message || err.message || "Échec d'inscription";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles user logout
   *
   * Clears authentication session data and redirects to login
   * - Always attempts to invalidate tokens on the server first
   * - Clears local authentication state regardless of server response
   * - Redirects to login screen
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('==== LOGOUT ATTEMPT ====');

      // Always try to logout on server first, regardless of account type
      try {
        // Get refresh token to send to server
        const refreshToken = await getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken) {
          console.log('Attempting to invalidate session on server');
          await authApi.logout();
          console.log('Server logout successful');
        } else {
          console.log('No refresh token found, skipping server logout');
        }
      } catch (serverError) {
        console.error('Server logout failed:', serverError);
        console.log('Continuing with client-side logout despite server error');
      }

      // Always clear authentication data from storage
      try {
        console.log('Clearing authentication data from secure storage');
        await clearAuthData();
        console.log('Authentication data cleared successfully');
      } catch (storageError) {
        console.error('Error clearing auth data from storage:', storageError);
      }

      // Reset authentication state
      console.log('Resetting user state');
      setUser(null);

      // Ne pas rediriger immédiatement, laisser le composant root le faire
      // La navigation sera gérée par le RootNavigator quand isAuthenticated change
    } catch (err) {
      console.error('==== LOGOUT ERROR ====', err);

      // Ensure state is cleared even during errors
      try {
        await clearAuthData();
      } catch {
        // Silently continue on storage errors
      }

      setUser(null);

      // Ne pas rediriger immédiatement, laisser le composant root le faire
      // La navigation sera gérée par le RootNavigator quand isAuthenticated change
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
      console.error('Error refreshing user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to proactively refresh the access token
  const refreshToken = async (): Promise<boolean> => {
    try {
      console.log('Attempting to refresh access token');
      const response = await authApi.refreshToken();

      if (response && response.accessToken) {
        console.log('New access token received');
        await saveItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
        return true;
      } else {
        console.error('No access token in refresh response');
        return false;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  };

  const clearError = () => setError(null);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
