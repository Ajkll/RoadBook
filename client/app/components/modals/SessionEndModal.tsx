import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useTheme } from '../../constants/theme';

interface SessionEndModalProps {
  visible: boolean;
  onConfirmSave: () => void;
  onCancel: () => void;
  onConfirmNoSave: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

const SessionEndModal: React.FC<SessionEndModalProps> = ({
  visible,
  onConfirmSave,
  onCancel,
  onConfirmNoSave,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0.35,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={{ flex: 1 }} onPress={onCancel} />
      </Animated.View>

      <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
        <Text style={styles.title}>Fin de session</Text>
        <Text style={styles.subtitle}>
          Souhaitez-vous sauvegarder ce trajet ou continuer ?
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onConfirmSave}
        >
          <Text style={styles.buttonText}>Sauvegarder et terminer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={onConfirmNoSave}
        >
          <Text style={styles.buttonText}>Terminer sans sauvegarder</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Continuer</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.ui.modal.overlay,
  },
  container: {
    position: 'absolute',
    top: '25%',
    alignSelf: 'center',
    backgroundColor: theme.colors.ui.modal.background,
    width: '85%',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xlarge,
    ...theme.shadow.lg
  },
  title: {
    ...theme.typography.header,
    color: theme.colors.backgroundText,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.backgroundTextSoft,
    marginBottom: theme.spacing.lg,
  },
  button: {
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.medium,
    width: '100%',
    marginBottom: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.ui.button.primary,
  },
  dangerButton: {
    backgroundColor: theme.colors.ui.status.error,
  },
  buttonText: {
    color: theme.colors.ui.button.primaryText,
    fontWeight: theme.typography.button.fontWeight,
    fontSize: theme.typography.button.fontSize,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: theme.spacing.xs,
  },
  cancelText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.button.fontWeight,
    fontSize: theme.typography.button.fontSize,
    textAlign: 'center',
  },
});

export default SessionEndModal;