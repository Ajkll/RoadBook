// components/common/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  type?: 'primary' | 'secondary';
  small?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: object;
}

const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  type = 'primary',
  small = false,
  icon,
  style
}) => {
  const { colors, spacing } = useTheme();

  const buttonStyle = [
    styles.button,
    {
      backgroundColor: type === 'primary' ? colors.primary : colors.secondary,
      padding: small ? spacing.sm : spacing.md,
    },
    style,
  ];

  const textStyle = [
    styles.text,
    {
      color: type === 'primary' ? colors.buttonTextPrimary : colors.buttonTextSecondary,
      fontSize: small ? 14 : 16,
    },
  ];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress}>
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={20} color={textStyle.color} style={styles.icon} />}
        <Text style={textStyle}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;