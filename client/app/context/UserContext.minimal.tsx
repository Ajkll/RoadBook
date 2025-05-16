// client/app/context/UserContext.minimal.tsx
// This is a minimal implementation of UserContext that should build without errors
// Use this file if the main UserContext.tsx has import or build issues

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

// Minimal context state
interface UserContextState {
  userData: any | null;
  isLoading: boolean;
  error: string | null;
  refreshUserData: () => Promise<void>;
  clearError: () => void;
}

// Create context
const UserContext = createContext<UserContextState | undefined>(undefined);

// Hook
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used with UserProvider');
  return context;
};

// Provider
export const UserProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const { user, refreshUserData: refreshAuthUser } = useAuth();
  const [userData, setUserData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update user data from auth context
  useEffect(() => {
    if (user) {
      setUserData(user);
    } else {
      setUserData(null);
    }
  }, [user]);
  
  const refreshUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await refreshAuthUser();
    } catch (err) {
      console.error('Error refreshing user data:', err);
      setError('Unable to load user data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearError = () => {
    setError(null);
  };
  
  const value = {
    userData,
    isLoading,
    error,
    refreshUserData,
    clearError,
  };
  
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;