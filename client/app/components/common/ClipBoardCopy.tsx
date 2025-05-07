import React, { useState } from 'react';
import { TouchableOpacity, View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../constants/theme';
import { Theme } from '../../constants/theme';
import { useNotifications } from '../NotificationHandler';
import { logger } from '../../utils/logger';

interface CopyToClipboardProps {
  text: string;
  displayText?: string;
  iconSize?: number;
  showText?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  iconStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const CopyToClipboard: React.FC<CopyToClipboardProps> = ({
  text,
  displayText,
  iconSize = 16,
  showText = false,
  containerStyle,
  iconStyle,
  textStyle,
}) => {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);
  const { showSuccess, showError } = useNotifications();

  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(text);
      setCopied(true);
      showSuccess('✓ Copié', 'Le texte a été copié dans le presse-papiers', {
        position: 'top',
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError('⛔ Erreur', "Échec de la copie dans le presse-papiers", {
        position: 'top',
      });
      logger.error('Erreur lors de la copie:', error);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {showText && <Text style={[styles.text(theme), textStyle]}>{displayText || text}</Text>}

      <TouchableOpacity
        onPress={handleCopy}
        style={[styles.iconContainer, iconStyle]}
        accessibilityLabel="Copier dans le presse-papiers"
      >
        <MaterialIcons
          name={copied ? 'check' : 'content-copy'}
          size={iconSize}
          color={copied ? theme.colors.success : theme.colors.primaryTextSoft}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as StyleProp<ViewStyle>,
  text: (theme: Theme) =>
    ({
      fontSize: theme.typography.caption.fontSize,
      color: theme.colors.primaryTextSoft,
    }) as StyleProp<TextStyle>,
  iconContainer: {
    padding: 4,
  } as StyleProp<ViewStyle>,
};