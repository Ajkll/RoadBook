import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../constants/theme';
import ProtectedRoute from '../../components/ProtectedRoute';

/**
 * Layout pour la section profil qui gère la navigation entre les différentes
 * pages du profil utilisateur et assure que les routes sont protégées
 */
export default function ProfileLayout() {
  const { colors } = useTheme();

  return (
    <ProtectedRoute>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerBackTitleVisible: false,
          animation: 'slide_from_right',
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Mon profil',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="edit" 
          options={{ 
            title: 'Modifier mon profil',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="change-password" 
          options={{ 
            title: 'Changer le mot de passe',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="sessions" 
          options={{ 
            title: 'Sessions actives',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="delete-account" 
          options={{ 
            title: 'Supprimer mon compte',
            headerShown: true,
          }}
        />
      </Stack>
    </ProtectedRoute>
  );
}