import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import { setComment, setShouldAskForComment } from '../../store/slices/commentSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../../store/store';
import Ionicons from '@expo/vector-icons/Ionicons';

interface SessionEndModalProps {
  visible: boolean;
  onConfirmSave: () => void;
  onCancel: () => void;
  onConfirmNoSave: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const DONT_ASK_KEY = '@dontAskForComments';

const SessionEndModal: React.FC<SessionEndModalProps> = ({
  visible,
  onConfirmSave,
  onCancel,
  onConfirmNoSave,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { shouldAskForComment } = useSelector((state: RootState) => state.comment);
  const { elapsedTime } = useSelector((state: RootState) => state.chrono);
  const { path, tracking } = useSelector((state: RootState) => state.location);
  const { mapReady } = useSelector((state: RootState) => state.location);

  //  animations
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [dontAskAgain, setDontAskAgain] = useState(false);

  const canSaveSession = mapReady && tracking && elapsedTime > 60 && path.length >= 3;

  const styles = StyleSheet.create({
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
      ...theme.shadow.lg,
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
    disabledButton: {
      backgroundColor: theme.colors.ui.button.disabled,
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
    commentInput: {
      borderWidth: 1,
      borderColor: theme.colors.secondary,
      borderRadius: theme.borderRadius.medium,
      padding: 12,
      marginBottom: 16,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    switchText: {
      marginLeft: 8,
      color: theme.colors.backgroundText,
    },
    cancelText: {
      color: theme.colors.primary,
      fontWeight: theme.typography.button.fontWeight,
      fontSize: theme.typography.button.fontSize,
      textAlign: 'center',
    },
    warningContainer: {
      backgroundColor: theme.colors.ui.status.errorBg,
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      marginBottom: theme.spacing.lg,
      opacity: blinkAnim,
      transform: [{ scale: pulseAnim }],
    },
    icon: {
      marginRight: 8,
      marginTop: 4,
    },
    warningText: {
      color: theme.colors.ui.status.error,
      ...theme.typography.body,
    },
  });

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

  useEffect(() => {
    if (!visible || canSaveSession) return;

    Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 3 }
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      blinkAnim.stopAnimation();
      pulseAnim.stopAnimation();
    };
  }, [visible, canSaveSession]);

  const handleConfirmSavePress = async () => {
    if (!canSaveSession) {
      onConfirmNoSave();
      return;
    }

    if (shouldAskForComment) {
      const dontAsk = await AsyncStorage.getItem(DONT_ASK_KEY);
      if (dontAsk !== 'true') {
        setShowCommentInput(true);
        return;
      }
    }
    handleFinalSave();
  };

  const handleFinalSave = async () => {
    if (dontAskAgain) {
      await AsyncStorage.setItem(DONT_ASK_KEY, 'true');
      dispatch(setShouldAskForComment(false));
    }

    dispatch(setComment(commentText));
    onConfirmSave();
  };

  const handleCommentSubmit = () => {
    handleFinalSave();
    setShowCommentInput(false);
  };

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity: overlayAnim }]}>
        <Pressable style={{ flex: 1 }} onPress={onCancel} />
      </Animated.View>

      <Animated.View style={[styles.container, { transform: [{ translateX: slideAnim }] }]}>
        {!showCommentInput ? (
          <>
            <Text style={styles.title}>Fin de session</Text>
            <Text style={styles.subtitle}>Souhaitez-vous sauvegarder ce trajet ou continuer ?</Text>

            {!canSaveSession && (
              <Animated.View style={styles.warningContainer}>
                <Ionicons name="warning" size={24} color="red" style={styles.icon} />
                <Text style={styles.warningText}>
                  Cette session ne sera pas enregistrée car :
                  {elapsedTime <= 60 && '\n- La durée est inférieure à 60 secondes'}
                  {path.length < 3 && '\n- Le trajet est trop court'}
                </Text>
              </Animated.View>
            )}

            <TouchableOpacity
              style={[styles.button, canSaveSession ? styles.primaryButton : styles.disabledButton]}
              onPress={handleConfirmSavePress}
              disabled={!canSaveSession}
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
          </>
        ) : (
          <>
            <Text style={styles.title}>Commentaire</Text>
            <Text style={styles.subtitle}>Ajoutez un commentaire sur votre session</Text>

            <TextInput
              style={styles.commentInput}
              multiline
              placeholder="Votre commentaire..."
              value={commentText}
              onChangeText={setCommentText}
            />

            <View style={styles.switchContainer}>
              <Switch
                value={dontAskAgain}
                onValueChange={setDontAskAgain}
              />
              <Text style={styles.switchText}>Ne plus demander</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleCommentSubmit}
            >
              <Text style={styles.buttonText}>Valider</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowCommentInput(false)}
            >
              <Text style={styles.cancelText}>Retour</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </Modal>
  );
};

export default SessionEndModal;