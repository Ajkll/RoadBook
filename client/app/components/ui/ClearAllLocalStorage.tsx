import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { clearAllPendingItems } from '../../store/slices/syncSlice';
import { useTheme } from '../../constants/theme';
import ConfirmModal from '../modals/ConfirmModal';
import { clearAllStorageData } from '../../utils/storageUtils';
import { useNotifications } from '../NotificationHandler';

const CleanupStorage = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const styles = createStyles(theme);
  const { showSuccess } = useNotifications();

  const handleCleanup = async () => {
    try {
      await clearAllStorageData();
      dispatch(clearAllPendingItems({ force: true }));
      showSuccess('Confirmation de la suppression', "Les données ont été correctement supprimées.", {
        position: 'top',
      });
    } catch (error) {
      console.error('Erreur lors du netoyage :', error);
    } finally {
      setShowModal(false); //on ferme le modal dans tout les cas
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons
          name="trash"
          size={24}
          color={theme.colors.destructiveText || theme.colors.primaryText}
        />
        <Text style={styles.buttonText}>TOUT EFFACER</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={showModal}
        title="Confirmation"
        message="Êtes-vous sûr de vouloir nettoyer tout le stockage local ? Cette action est irréversible."
        confirmText="Confirmer la suppression"
        cancelText="Annuler"
        onConfirm={handleCleanup}
        onCancel={() => setShowModal(false)}
        destructive={true}
      />
    </View>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: '100%',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.destructive || theme.colors.error,
      ...theme.shadow.sm,
    },
    button: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.destructive || theme.colors.error,
      width: '100%',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.borderRadius.small,
      ...theme.shadow.md,
    },
    buttonText: {
      color: theme.colors.destructiveText || theme.colors.primaryText,
      fontWeight: theme.typography.button.fontWeight,
      fontSize: theme.typography.button.fontSize,
      marginLeft: theme.spacing.sm,
    },
  });

export default CleanupStorage;
