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
  containerStyle = {}
}) => {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.bottomButtonContainer, containerStyle]}>
      <TouchableOpacity
        style={[styles.button, {
          backgroundColor: theme.colors.ui.button.primary,
          borderRadius: theme.borderRadius.medium,
          paddingVertical: theme.spacing.sm,
          ...theme.shadow.sm,
        }]}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={[
          theme.typography.button,
          { color: theme.colors.ui.button.primaryText }
        ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomButtonContainer: {
    marginTop: 16,
    paddingHorizontal: 8,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default GoBackHomeButton;