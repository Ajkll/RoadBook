// client/app/context/SimpleAuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { User, LoginRequest, RegisterRequest } from '../types/auth.types';
import { authApi } from '../services/api/auth.api';
import { logger } from '../utils/logger';
import { authEvents } from '../services/api/client';
import simpleAuthStorage from '../services/simpleAuthStorage';

interface SimpleAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider: React.FC<SimpleAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  // Écouter les événements d'échec d'authentification
  useEffect(() => {
    const handleAuthFailure = () => {
      logger.warn('Auth failure event received in SimpleAuthContext');
      if (isMounted.current) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        setUser(null);
      }
    };
    
    // Ajouter l'écouteur d'événements
    authEvents.on('auth:failure', handleAuthFailure);
    
    return () => {
      isMounted.current = false;
      authEvents.off('auth:failure', handleAuthFailure);
    };
  }, []);

  // Charger les données utilisateur au démarrage
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        console.log('Loading user data from simple auth storage...');
        const { user: storedUser } = simpleAuthStorage.getUserData();

        if (storedUser) {
          console.log('Found stored user data:', storedUser.email);
          setUser(storedUser);
        } else {
          console.log('No stored user data found');
        }
      } catch (err) {
        logger.error('Error loading user from simple storage:', err);
        simpleAuthStorage.clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  /**
   * Fonction de connexion - avec stockage simplifié
   */
  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      // Valider les identifiants basiques
      if (!credentials.email || !credentials.password) {
        setError('Email et mot de passe requis');
        return;
      }

      // Sauvegarder les identifiants pour pouvoir les réutiliser
      simpleAuthStorage.saveCredentials(credentials.email, credentials.password);

      // Appeler l'API de connexion
      const response = await authApi.login(credentials);
      console.log('Login successful:', response);

      // Stocker les données utilisateur en mémoire
      simpleAuthStorage.saveUserData(
        response.user, 
        response.accessToken, 
        response.refreshToken
      );

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
   * Fonction d'inscription - avec stockage simplifié
   */
  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.register(userData);
      console.log('Registration successful:', response);

      // Sauvegarder les identifiants pour pouvoir les réutiliser
      if (userData.email && userData.password) {
        simpleAuthStorage.saveCredentials(userData.email, userData.password);
      }
      
      // Stocker les données utilisateur en mémoire
      simpleAuthStorage.saveUserData(
        response.user, 
        response.accessToken, 
        response.refreshToken
      );

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
   * Fonction de déconnexion - avec stockage simplifié
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      console.log('==== LOGOUT ATTEMPT ====');

      // Tenter de déconnecter la session sur le serveur
      try {
        await authApi.logout();
        console.log('Server logout successful');
      } catch (serverError) {
        logger.error('Server logout failed:', serverError);
        console.log('Continuing with client-side logout despite server error');
      }

      // Effacer les données d'authentification locales
      simpleAuthStorage.clearAuthData();
      console.log('Authentication data cleared');

      // Réinitialiser l'état utilisateur
      setUser(null);

    } catch (err) {
      logger.error('==== LOGOUT ERROR ====', err);
      
      // En cas d'erreur, s'assurer que les données sont bien effacées
      simpleAuthStorage.clearAuthData();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Rafraîchir les données utilisateur depuis le serveur
   */
  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      console.log('Refreshing user profile data');

      const updatedUser = await authApi.getCurrentUser();
      
      // Mettre à jour les données utilisateur en mémoire
      simpleAuthStorage.saveUserData(updatedUser);
      
      // Mettre à jour l'état utilisateur
      setUser(updatedUser);
      console.log('User data refreshed successfully');
      
      return updatedUser;
    } catch (err) {
      logger.error('Error refreshing user data:', err);
      
      // Si c'est une erreur d'authentification, déconnecter l'utilisateur
      if (err?.isRefreshError || 
          (err?.originalError?.response?.status === 401) ||
          (err?.response?.status === 401) ||
          err.message?.includes('Session expirée')) {
            
        logger.warn('Token expired while refreshing user data, logging out');
        setError('Votre session a expiré. Veuillez vous reconnecter.');
        
        try {
          await logout();
        } catch (logoutError) {
          logger.error('Error during auto-logout:', logoutError);
          setUser(null);
          simpleAuthStorage.clearAuthData();
        }
      }
      
      throw err;
    } finally {
      setIsLoading(false);
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
    clearError
  };

  return <SimpleAuthContext.Provider value={value}>{children}</SimpleAuthContext.Provider>;
};