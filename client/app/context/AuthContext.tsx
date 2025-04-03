// client/app/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from 'expo-router';
import { User, LoginRequest, RegisterRequest, UserRole } from '../types/auth.types';
import { authApi } from '../services/api/auth.api';
import { getAuthData, clearAuthData, saveItem, STORAGE_KEYS } from '../services/secureStorage';

interface AuthContextType {
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
        const { user } = await getAuthData();
        if (user) {
          setUser(user);
        }
      } catch (err) {
        console.error('Error loading user from storage:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.login(credentials);
      setUser(response.user);

      // Rediriger vers l'application principale après la connexion
      router.replace('/(tabs)');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Échec de connexion';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authApi.register(userData);
      setUser(response.user);

      // Rediriger vers l'application principale après l'inscription
      router.replace('/(tabs)');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Échec d'inscription";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      await authApi.logout();
      setUser(null);

      // Rediriger vers la page de connexion
      router.replace('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Même en cas d'erreur, on déconnecte l'utilisateur côté client
      setUser(null);
      router.replace('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    try {
      setIsLoading(true);

      const updatedUser = await authApi.getCurrentUser();
      setUser(updatedUser);
    } catch (err) {
      console.error('Error refreshing user data:', err);
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
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
