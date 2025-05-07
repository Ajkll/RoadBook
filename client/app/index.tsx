// client/app/index.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from './context/AuthContext';
import { getItem, STORAGE_KEYS } from './services/secureStorage';
import { useTheme } from './constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors } = useTheme();

  // Vérifier s'il y a un chemin de redirection après login
  useEffect(() => {
    const checkRedirect = async () => {
      if (isAuthenticated) {
        const redirectPath = await getItem(STORAGE_KEYS.REDIRECT_PATH);
        if (redirectPath) {
          // Nettoyer après utilisation
          // await removeItem(STORAGE_KEYS.REDIRECT_PATH);
          // Ici vous pourriez utiliser redirectPath pour une redirection personnalisée
        }
      }
    };

    checkRedirect();
  }, [isAuthenticated]);

  // Afficher un indicateur de chargement pendant la vérification
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Rediriger en fonction de l'état d'authentification
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/auth/login" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
