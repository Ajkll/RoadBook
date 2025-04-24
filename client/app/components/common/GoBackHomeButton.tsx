import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../constants/theme';

type GoBackHomeButtonProps = {
  label?: string;
  containerStyle?: object;
};

const GoBackHomeButton: React.FC<GoBackHomeButtonProps> = ({
  label = "Retour à l'accueil",
  containerStyle = {},
}) => {
  const router = useRouter();
  const theme = useTheme();

  // Créez les styles dynamiquement avec le thème
  const styles = createStyles(theme);

  return (
    <View style={[styles.bottomButtonContainer, containerStyle]}>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Déplacez la création des styles dans une fonction séparée
const createStyles = (theme: any) =>
  StyleSheet.create({
    bottomButtonContainer: {
      marginTop: 16,
      paddingHorizontal: 8,
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.ui.button.primary,
      borderRadius: theme.borderRadius.medium,
      paddingVertical: theme.spacing.sm,
      ...theme.shadow.xl,
    },
    buttonText: {
      ...theme.typography.button,
      color: theme.colors.ui.button.primaryText,
    },
  });

export default GoBackHomeButton;
