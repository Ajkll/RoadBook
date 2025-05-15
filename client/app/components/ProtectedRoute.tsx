// client/app/components/ProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth.types';
import { saveItem, STORAGE_KEYS } from '../services/secureStorage';
import { logger } from '../utils/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading, error, refreshUserData, refreshToken } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Stockage du chemin actuel pour redirection après login
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Use our secure storage utility instead of AsyncStorage directly
      saveItem(STORAGE_KEYS.REDIRECT_PATH, pathname);
    }
  }, [isAuthenticated, isLoading, pathname]);

  // Effect to handle token refresh on initial mount
  useEffect(() => {
    const validateSession = async () => {
      // Only run this if we think we're authenticated but might have an expired token
      if (isAuthenticated && !isLoading && !isRefreshing) {
        try {
          setIsRefreshing(true);
          
          // Attempt to refresh user data which will validate our session
          await refreshUserData();
          setAuthError(null);
        } catch (err) {
          logger.error('Error validating session in ProtectedRoute:', err);
          
          // If we get a 401 error, try to refresh the token
          if (err?.response?.status === 401 || 
              err?.originalError?.response?.status === 401 ||
              err.message?.includes('Session expirée')) {
            
            logger.info('Session expired, attempting token refresh');
            
            try {
              // Try to refresh the token
              const refreshed = await refreshToken();
              
              if (refreshed) {
                logger.info('Token refreshed successfully, reloading user data');
                await refreshUserData();
                setAuthError(null);
              } else {
                logger.warn('Token refresh failed, redirecting to login');
                setAuthError('Session expirée. Veuillez vous reconnecter.');
                // Router will redirect on next render due to !isAuthenticated
              }
            } catch (refreshError) {
              logger.error('Error during token refresh:', refreshError);
              setAuthError('Session expirée. Veuillez vous reconnecter.');
            }
          } else {
            // Some other error occurred
            setAuthError(err.message || 'Erreur de chargement des données utilisateur');
          }
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    validateSession();
  }, [isAuthenticated, isLoading]);

  // Show loading indicator while checking authentication status
  if (isLoading || isRefreshing) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        {isRefreshing && (
          <Text style={styles.refreshingText}>Actualisation de votre session...</Text>
        )}
      </View>
    );
  }

  // Show error if there's an authentication problem
  if (authError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Problème d'authentification</Text>
        <Text style={styles.errorMessage}>{authError}</Text>
        <Text 
          style={styles.errorLink}
          onPress={() => router.replace('/auth/login')}
        >
          Retourner à l'écran de connexion
        </Text>
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  // Vérification des rôles si spécifiés
  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>Accès refusé</Text>
        <Text style={styles.errorMessage}>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </Text>
      </View>
    );
  }

  // Si tout est OK, afficher le contenu protégé
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorLink: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 16,
  },
  refreshingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
});
