import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTheme } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';

export default function ProfileButton() {
  const router = useRouter();
  const theme = useTheme();

  const styles = {
    container: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.ui.card.background,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...theme.shadow.xl,
    },
    text: {
      fontSize: theme.typography.title.fontSize,
      color: theme.colors.primary,
    },
  };

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/profile')}
      style={styles.container}
    >
      <Text style={styles.text}>Paramétres de profil</Text>
      <MaterialIcons name="chevron-right" size={24} color={theme.colors.primary} />
    </TouchableOpacity>
  );
}