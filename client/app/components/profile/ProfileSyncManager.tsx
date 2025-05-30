import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Platform, EventEmitter, NativeEventEmitter } from 'react-native';
import { User } from '../../types/auth.types';
import { useAuth } from '../../context/AuthContext';
import usersApi from '../../services/api/users.api';
import { logger } from '../../utils/logger';
import { apiClient } from '../../services/api/client';

// Type definitions for the profile sync context
interface ProfileSyncContextType {
  profileData: User | null;
  isLoading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfileField: <K extends keyof User>(field: K, value: User[K]) => Promise<void>;
  updateProfileFields: (fields: Partial<User>) => Promise<void>;
  clearError: () => void;
}

// Create a context for profile synchronization
const ProfileSyncContext = createContext<ProfileSyncContextType | undefined>(undefined);

// Event names
const PROFILE_UPDATED_EVENT = 'profile:updated';
const PROFILE_UPDATED_NATIVE_EVENT = 'profileUpdated';

// Créer ou obtenir un émetteur d'événements pour React Native
const eventEmitter = new NativeEventEmitter();

// Function to notify other components of profile updates (can be called from anywhere)
export function notifyProfileUpdate(user: User): void {
  if (Platform.OS === 'web') {
    // Pour le web, utiliser l'API du navigateur
    try {
      // Créer un simple événement pour les environnements sans CustomEvent
      const event = new Event(PROFILE_UPDATED_EVENT);
      // Ajouter les données utilisateur à l'événement
      (event as any).detail = { user };
      window.dispatchEvent(event);
    } catch (error) {
      logger.warn('Event creation not supported in this environment:', error);
    }
  } else {
    // Pour les plateformes natives
    eventEmitter.emit(PROFILE_UPDATED_NATIVE_EVENT, { user });
  }
}

// Provider props interface
interface ProfileSyncProviderProps {
  children: ReactNode;
}

// Vérifie si le fournisseur d'authentification est disponible
function useOptionalAuth() {
  try {
    return useAuth();
  } catch (error) {
    logger.warn('Auth provider not available, running in standalone mode');
    return { user: null, updateProfile: null };
  }
}

// Provider component to wrap app sections that need profile synchronization
export const ProfileSyncProvider: React.FC<ProfileSyncProviderProps> = ({ children }) => {
  // Get user from AuthContext if available
  const { user: authUser, updateProfile: authUpdateProfile } = useOptionalAuth();
  
  // Local state for profile data
  const [profileData, setProfileData] = useState<User | null>(authUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize profile data from auth context
  useEffect(() => {
    if (authUser && (!profileData || authUser.id !== profileData.id)) {
      setProfileData(authUser);
    }
  }, [authUser]);

  // Event listener setup for profile updates
  useEffect(() => {
    // Handler for profile update events
    const handleProfileUpdate = (event: any) => {
      const userData = Platform.OS === 'web' 
        ? (event.detail?.user || (event as any).detail?.user)
        : event?.user;
      
      if (userData) {
        logger.info('ProfileSyncManager: Profile update event received');
        setProfileData(prevData => {
          // Only update if the data is different or newer
          if (!prevData || (userData.updatedAt && prevData.updatedAt && userData.updatedAt > prevData.updatedAt)) {
            return userData;
          }
          return prevData;
        });
      }
    };

    // Platform-specific event listener setup
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
    } else {
      const subscription = eventEmitter.addListener(
        PROFILE_UPDATED_NATIVE_EVENT, 
        handleProfileUpdate
      );
      
      return () => {
        subscription.remove();
      };
    }

    // Cleanup for web platform
    return () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdate);
      }
    };
  }, []);

  // Refresh profile data from the server
  const refreshProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updatedUser = await usersApi.getCurrentUser();
      setProfileData(updatedUser);
      
      // Also update AuthContext to keep everything in sync
      if (authUpdateProfile) {
        try {
          await authUpdateProfile(updatedUser);
        } catch (authError) {
          logger.warn('Failed to update AuthContext with refreshed profile:', authError);
          // Continue since we at least updated our local state
        }
      }
    } catch (error) {
      logger.error('Error refreshing profile data:', error);
      
      // Specific error handling with fallbacks
      if (error.response?.status === 404) {
        setError('Profil non trouvé. Veuillez vous reconnecter.');
      } else if (error.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else if (!error.response) {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
        
        // If we have cached data, continue using it
        if (!profileData && authUser) {
          setProfileData(authUser);
          logger.info('Using cached profile data from AuthContext during connection error');
        }
      } else {
        setError(error.message || 'Erreur lors du rafraîchissement du profil');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update a single profile field
  const updateProfileField = async <K extends keyof User>(
    field: K, 
    value: User[K]
  ): Promise<void> => {
    await updateProfileFields({ [field]: value } as Partial<User>);
  };

  // Update multiple profile fields
  const updateProfileFields = async (fields: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Update database directly if AuthContext is not available
      let updatedUser: User;
      
      if (authUpdateProfile) {
        // Use AuthContext's updateProfile to ensure everything stays in sync
        updatedUser = await authUpdateProfile(fields);
      } else {
        try {
          // Direct API call if AuthContext is not available
          logger.info('ProfileSyncManager: Making direct API call to update profile');
          updatedUser = await usersApi.updateProfile(fields);
        } catch (directApiError) {
          logger.error('ProfileSyncManager: Direct API call failed:', directApiError);
          throw directApiError;
        }
      }
      
      // Update our local state
      setProfileData(prev => prev ? { ...prev, ...updatedUser } : updatedUser);
      
      // Notify other components
      notifyProfileUpdate(updatedUser);
      
    } catch (error) {
      logger.error('Error updating profile fields:', error, fields);
      
      if (error.response?.status === 404) {
        setError('Profil non trouvé. Veuillez vous reconnecter.');
      } else if (error.response?.status === 400) {
        // Handle specific validation errors
        const errorMessage = error.response?.data?.message || error.message;
        if (errorMessage.includes('email')) {
          setError('Format d\'email invalide ou adresse déjà utilisée');
        } else if (errorMessage.includes('phone')) {
          setError('Format de numéro de téléphone invalide');
        } else {
          setError(errorMessage || 'Données de profil invalides');
        }
      } else if (!error.response) {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
      } else {
        setError(error.message || 'Erreur lors de la mise à jour du profil');
      }
      
      throw error; // Re-throw to let caller handle the error too
    } finally {
      setIsLoading(false);
    }
  };

  // Clear any error messages
  const clearError = () => setError(null);

  // Context value
  const value: ProfileSyncContextType = {
    profileData,
    isLoading,
    error,
    refreshProfile,
    updateProfileField,
    updateProfileFields,
    clearError
  };

  return (
    <ProfileSyncContext.Provider value={value}>
      {children}
    </ProfileSyncContext.Provider>
  );
};

// Hook to use profile sync context
export const useProfileSync = (): ProfileSyncContextType => {
  const context = useContext(ProfileSyncContext);
  if (context === undefined) {
    throw new Error('useProfileSync must be used within a ProfileSyncProvider');
  }
  return context;
};

// DefaultProfileSyncManager component that can be included once at the app root
// to ensure profile synchronization is enabled app-wide
export const DefaultProfileSyncManager: React.FC = () => {
  // Try to use the context, but handle errors gracefully
  let context;
  try {
    context = useProfileSync();
  } catch (error) {
    logger.warn('ProfileSyncManager: Profile sync context not available, skipping initial sync');
    return null;
  }
  
  const { refreshProfile } = context;
  
  // Initial load and periodic refresh
  useEffect(() => {
    const initialLoad = async () => {
      try {
        await refreshProfile();
      } catch (error) {
        logger.warn('Initial profile sync failed:', error);
      }
    };
    
    initialLoad();
    
    // Optional: Set up periodic refresh every 5 minutes
    const intervalId = setInterval(refreshProfile, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  // This component doesn't render anything visible
  return null;
};

export default ProfileSyncProvider;