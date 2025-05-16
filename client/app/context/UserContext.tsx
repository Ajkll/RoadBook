// client/app/context/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { User } from '../types/auth.types';
import apiClient from '../services/api/client';
import { logger } from '../utils/logger';
// Import these explicitly to avoid circular dependencies
import { saveItem, getItem } from '../services/secureStorage';

// Types for user stats
interface UserStats {
  totalSessions?: number;
  totalDistance?: number;
  totalDrivingHours?: number;
  badgesCount?: number;
  competenciesMastered?: number;
  competencyProgress?: {
    notStarted: number;
    inProgress: number;
    mastered: number;
  };
}

// Types for user activity
interface UserActivity {
  lastSessionDate?: string;
  recentSessions?: {
    id: string;
    date: string;
    duration: number;
    distance?: number;
    startLocation?: string;
    endLocation?: string;
  }[];
  upcomingSessions?: {
    id: string;
    date: string;
    duration?: number;
    location?: string;
  }[];
  recentNotifications?: {
    id: string;
    type: string;
    title: string;
    message: string;
    date: string;
    isRead: boolean;
  }[];
}

// Extended user interface
interface ExtendedUser extends User {
  // Enriched data that will be loaded on demand
  stats?: UserStats;
  activity?: UserActivity;
  badges?: {
    id: string;
    name: string;
    imageUrl: string;
  }[];
  notifications?: {
    count: number;
    unread: number;
  };
}

// User context state
interface UserContextState {
  // User data
  userData: ExtendedUser | null;
  isLoading: boolean;
  error: string | null;
  
  // Functions for manipulating data
  refreshUserData: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
  updateUserAvatar: (imageUri: string) => Promise<void>;
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  loadUserStats: () => Promise<UserStats>;
  loadUserActivity: () => Promise<UserActivity>;
  clearError: () => void;
}

// Create the context
const UserContext = createContext<UserContextState | undefined>(undefined);

// Custom hook to use the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used with a UserProvider');
  }
  return context;
};

// Provider props
interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Use the auth context to get the basic identity
  const { user, refreshUserData: refreshAuthUser } = useAuth();
  
  // Internal state
  const [userData, setUserData] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Update user data from the auth context
  useEffect(() => {
    if (user) {
      // Initialize with user basic data
      setUserData(prevData => ({
        ...user,
        // Keep enriched data if they already exist
        ...(prevData && {
          stats: prevData.stats,
          activity: prevData.activity,
          badges: prevData.badges,
          notifications: prevData.notifications
        })
      }));
    } else {
      setUserData(null);
    }
  }, [user]);

  // Refresh complete user data
  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use auth context refresh function
      // This will update the base data via the effect above
      await refreshAuthUser();
      
      // Load additional data if needed
      if (user) {
        try {
          // Load user statistics
          const stats = await loadUserStats();
          // Load user activity
          const activity = await loadUserActivity();
          
          // Update state with enriched data
          setUserData(prevData => {
            if (!prevData) return null;
            return {
              ...prevData,
              stats,
              activity
            };
          });
        } catch (enrichError) {
          // If enrichment fails, it's not critical
          // Keep the base data
          logger.warn('Error loading enriched data:', enrichError);
        }
      }
    } catch (err) {
      logger.error('Error refreshing user data:', err);
      setError('Unable to load user data');
      // Don't clear userData - keep what we already have
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API call to update profile
      const response = await apiClient.put('/users/profile', data);
      
      // Update local data
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          ...data
        };
      });
      
      // Refresh complete user data
      await refreshAuthUser();
      
      return response.data;
    } catch (err) {
      logger.error('Error updating profile:', err);
      setError('Unable to update profile');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user avatar
  const updateUserAvatar = async (imageUri: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Create FormData to upload image
      const formData = new FormData();
      formData.append('avatar', {
        uri: imageUri,
        name: 'avatar.jpg',
        type: 'image/jpeg'
      } as any);
      
      // API call to upload avatar
      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update local data
      setUserData(prevData => {
        if (!prevData) return null;
        return {
          ...prevData,
          profilePicture: response.data.profilePicture
        };
      });
      
      return response.data;
    } catch (err) {
      logger.error('Error updating avatar:', err);
      setError('Unable to update avatar');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user password
  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // API call to update password
      const response = await apiClient.put('/users/password', {
        currentPassword,
        newPassword
      });
      
      return response.data;
    } catch (err) {
      logger.error('Error updating password:', err);
      setError('Unable to update password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load user statistics
  const loadUserStats = async (): Promise<UserStats> => {
    try {
      // Direct API call instead of using userApi
      const response = await apiClient.get('/user/stats');
      const stats = response.data;
      
      // Update user data with statistics
      if (userData) {
        const updatedUserData = {
          ...userData,
          stats
        };
        
        setUserData(updatedUserData);
      }
      
      return stats;
    } catch (err) {
      logger.error('Error loading statistics:', err);
      // Return default statistics in case of error
      return {
        totalSessions: 0,
        totalDistance: 0,
        totalDrivingHours: 0,
        badgesCount: 0,
        competenciesMastered: 0,
        competencyProgress: {
          notStarted: 0,
          inProgress: 0,
          mastered: 0
        }
      };
    }
  };

  // Load user activity
  const loadUserActivity = async (): Promise<UserActivity> => {
    try {
      // Direct API call instead of using userApi
      const response = await apiClient.get('/user/activity');
      const activity = response.data;
      
      // Update user data with activity
      if (userData) {
        const updatedUserData = {
          ...userData,
          activity
        };
        
        setUserData(updatedUserData);
      }
      
      return activity;
    } catch (err) {
      logger.error('Error loading activity:', err);
      // Return default data in case of error
      return {
        recentSessions: [],
        upcomingSessions: [],
        recentNotifications: []
      };
    }
  };

  // Clear errors
  const clearError = () => {
    setError(null);
  };

  // Context value
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

export default UserContext;