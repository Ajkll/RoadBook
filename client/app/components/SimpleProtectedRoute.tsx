// client/app/components/SimpleProtectedRoute.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, usePathname, useRouter } from 'expo-router';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { UserRole } from '../types/auth.types';
import { logger } from '../utils/logger';

interface SimpleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function SimpleProtectedRoute({ children, allowedRoles }: SimpleProtectedRouteProps) {
  const { isAuthenticated, user, isLoading, error, refreshUserData } = useSimpleAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Effet pour valider la session au montage
  useEffect(() => {
    const validateSession = async () => {
      // Ne vérifier que si l'utilisateur semble authentifié
      if (isAuthenticated && !isLoading && !isRefreshing) {
        try {
          setIsRefreshing(true);
          
          // Tenter de rafraîchir les données utilisateur pour valider la session
          await refreshUserData();
          setAuthError(null);
        } catch (err) {
          logger.error('Error validating session in SimpleProtectedRoute:', err);
          
          // Si erreur d'authentification, rediriger vers login
          if (err?.response?.status === 401 || 
              err?.originalError?.response?.status === 401 ||
              err.message?.includes('Session expirée')) {
            
            logger.warn('Session expired, redirecting to login');
            setAuthError('Session expirée. Veuillez vous reconnecter.');
          } else {
            // Une autre erreur est survenue
            setAuthError(err.message || 'Erreur de chargement des données utilisateur');
          }
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    validateSession();
  }, [isAuthenticated, isLoading]);

  // Afficher un indicateur de chargement
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

  // Afficher une erreur en cas de problème d'authentification
  if (authError) {
    logger.warn('Auth error in SimpleProtectedRoute:', authError);
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

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    logger.warn('Not authenticated in SimpleProtectedRoute, redirecting to login');
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