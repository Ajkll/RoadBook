// client/app/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { User } from '../types/auth.types';
import apiClient from '../services/api/client';
import { logger } from '../utils/logger';

// Types étendus pour les données utilisateur
interface UserStats {
  totalSessions?: number;
  totalDistance?: number;
  badgesCount?: number;
  competencyProgress?: {
    notStarted: number;
    inProgress: number;
    mastered: number;
  };
}

interface UserActivity {
  lastSessionDate?: string;
  recentSessions?: {
    id: string;
    date: string;
    duration: number;
    distance?: number;
  }[];
  upcomingReminders?: {
    id: string;
    title: string;
    date: string;
  }[];
}

// Interface utilisateur complète
interface ExtendedUser extends User {
  // Données enrichies qui seront chargées à la demande
  stats?: UserStats;
  activity?: UserActivity;
  badge?: {
    id: string;
    name: string;
    imageUrl: string;
  }[];
  notifications?: {
    count: number;
    unread: number;
  };
}

// État global du contexte utilisateur
interface UserContextState {
  // Données utilisateur
  userData: ExtendedUser | null;
  isLoading: boolean;
  error: string | null;
  
  // Fonctions pour manipuler les données
  refreshUserData: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateUserAvatar: (imageUri: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loadUserStats: () => Promise<UserStats>;
  loadUserActivity: () => Promise<UserActivity>;
  clearError: () => void;
}

// Créer le contexte
const UserContext = createContext<UserContextState | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser doit être utilisé avec un UserProvider');
  }
  return context;
};

// Props du provider
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Utiliser le contexte d'authentification pour obtenir l'identité de base
  const { user, refreshUserData: refreshAuthUser } = useAuth();
  
  // État interne
  const [userData, setUserData] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour les données utilisateur depuis le contexte d'authentification
  useEffect(() => {
    if (user) {
      // Initialiser avec les données de base de l'utilisateur
      setUserData(prevData => ({
        ...user,
        // Conserver les données enrichies si elles existent déjà
        ...(prevData && {
          stats: prevData.stats,
          activity: prevData.activity,
          badge: prevData.badge,
          notifications: prevData.notifications
        })
      }));
    } else {
      setUserData(null);
    }
  }, [user]);

  // Rafraîchir les données utilisateur complètes
  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Utiliser la fonction de rafraîchissement du contexte d'auth
      // Cela mettra à jour les données de base via l'effet ci-dessus
      await refreshAuthUser();
      
      // Charger des données supplémentaires si nécessaire
      // Par exemple, les statistiques et l'activité récente
      if (user) {
        try {
          // Charger les statistiques utilisateur
          const stats = await loadUserStats();
          // Charger l'activité utilisateur
          const activity = await loadUserActivity();
          
          // Mettre à jour l'état avec les données enrichies
          setUserData(prevData => {
            if (!prevData) return null;
            return {
              ...prevData,
              stats,
              activity
            };
          });
        } catch (enrichError) {
          // Si l'enrichissement échoue, ce n'est pas critique
          // On conserve les données de base
          logger.warn('Erreur lors du chargement des données enrichies:', enrichError);
        }
      }
    } catch (err) {
      logger.error('Erreur lors du rafraîchissement des données utilisateur:', err);
      setError('Impossible de charger les données utilisateur');
      // Ne pas effacer userData - conserver ce qu'on a déjà
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour le profil utilisateur
  const updateUserProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel API pour mettre à jour le profil
      const response = await apiClient.put('/users/profile', data);
      
      // Mettre à jour les données locales
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          ...data
        };
      });
      
      // Rafraîchir les données utilisateur complètes
      await refreshAuthUser();
      
      return response.data;
    } catch (err) {
      logger.error('Erreur lors de la mise à jour du profil:', err);
      setError('Impossible de mettre à jour le profil');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour l'avatar utilisateur
  const updateUserAvatar = async (imageUri: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Créer un FormData pour téléverser l'image
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        name: 'avatar.jpg',
        type: 'image/jpeg'
      });
      
      // Appel API pour téléverser l'avatar
      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Mettre à jour les données locales
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          profilePicture: response.data.profilePicture
        };
      });
      
      return response.data;
    } catch (err) {
      logger.error('Erreur lors de la mise à jour de l\'avatar:', err);
      setError('Impossible de mettre à jour l\'avatar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour le mot de passe utilisateur
  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Appel API pour mettre à jour le mot de passe
      const response = await apiClient.put('/users/password', {
        currentPassword,
        newPassword
      });
      
      return response.data;
    } catch (err) {
      logger.error('Erreur lors de la mise à jour du mot de passe:', err);
      setError('Impossible de mettre à jour le mot de passe');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les statistiques utilisateur
  const loadUserStats = async (): Promise<UserStats> => {
    try {
      // Utiliser notre nouvelle API utilisateur dédiée
      const { default: userApi } = await import('../services/api/user.api');
      const stats = await userApi.getUserStats();
      
      // Mettre à jour les données utilisateur avec les statistiques
      if (userData) {
        const updatedUserData = {
          ...userData,
          stats
        };
        
        setUserData(updatedUserData);
      }
      
      return stats;
    } catch (err) {
      logger.error('Erreur lors du chargement des statistiques:', err);
      // Retourner des statistiques par défaut en cas d'erreur
      return {
        totalSessions: 0,
        totalDistance: 0,
        badgesCount: 0,
        competencyProgress: {
          notStarted: 0,
          inProgress: 0,
          mastered: 0
        }
      };
    }
  };

  // Charger l'activité utilisateur
  const loadUserActivity = async (): Promise<UserActivity> => {
    try {
      // Utiliser notre nouvelle API utilisateur dédiée
      const { default: userApi } = await import('../services/api/user.api');
      const activity = await userApi.getUserActivity();
      
      // Mettre à jour les données utilisateur avec l'activité
      if (userData) {
        const updatedUserData = {
          ...userData,
          activity
        };
        
        setUserData(updatedUserData);
      }
      
      return activity;
    } catch (err) {
      logger.error('Erreur lors du chargement de l\'activité:', err);
      // Retourner des données par défaut en cas d'erreur
      return {
        recentSessions: [],
        upcomingSessions: [],
        recentNotifications: []
      };
    }
  };

  // Effacer les erreurs
  const clearError = () => {
    setError(null);
  };

  // Valeur du contexte
  const value: UserContextState = {
    userData,
    isLoading,
    error,
    refreshUserData,
    updateUserProfile,
    updateUserAvatar,
    updateUserPassword,
    loadUserStats,
    loadUserActivity,
    clearError
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};