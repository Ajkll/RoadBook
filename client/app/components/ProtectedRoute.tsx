// client/app/components/ProtectedRoute.tsx
import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/auth.types';
import { saveItem, STORAGE_KEYS } from '../services/secureStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const pathname = usePathname();

  // Stockage du chemin actuel pour redirection après login
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Use our secure storage utility instead of AsyncStorage directly
      saveItem(STORAGE_KEYS.REDIRECT_PATH, pathname);
    }
  }, [isAuthenticated, isLoading, pathname]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

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
  },
});
