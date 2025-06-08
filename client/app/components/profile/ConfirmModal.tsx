import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useTheme } from '../../constants/theme';

interface ConfirmModalProps {
  showConfirmModal: boolean;
  setShowConfirmModal: (show: boolean) => void;
  modalAction: string;
  modalMessage: string;
  deleteConfirmText: string;
  setDeleteConfirmText: (text: string) => void;
  handleConfirmAction: () => Promise<void>;
}

export default function ConfirmModal({
  showConfirmModal,
  setShowConfirmModal,
  modalAction,
  modalMessage,
  deleteConfirmText,
  setDeleteConfirmText,
  handleConfirmAction
}: ConfirmModalProps) {
  const { colors, dark } = useTheme();
  return (
    <Modal
      visible={showConfirmModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.ui.modal.background }]}>
          <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>
            {modalAction === 'logout' ? 'Déconnexion' : 'Suppression du compte'}
          </Text>
          <Text style={[styles.modalMessage, { color: colors.backgroundTextSoft }]}>{modalMessage}</Text>
          
          {modalAction === 'delete' && (
            <TextInput
              style={[styles.confirmInput, { 
                borderColor: colors.border, 
                backgroundColor: colors.background,
                color: colors.backgroundText
              }]}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Tapez SUPPRIMER"
              placeholderTextColor={colors.backgroundTextSoft}
            />
          )}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalCancelButton, { borderColor: colors.border }]}
              onPress={() => {
                setShowConfirmModal(false);
                setDeleteConfirmText('');
              }}
            >
              <Text style={[styles.modalCancelText, { color: colors.backgroundTextSoft }]}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalConfirmButton, 
                { backgroundColor: modalAction === 'delete' ? colors.danger : colors.primary }
              ]}
              onPress={handleConfirmAction}
            >
              <Text style={styles.modalConfirmText}>
                {modalAction === 'logout' ? 'Se déconnecter' : 'Supprimer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
  },
  confirmInput: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
  },
  modalCancelText: {
    fontWeight: '500',
  },
  modalConfirmButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
    borderRadius: 5,
  },
  modalDeleteButton: {
    // Conservé pour compatibilité descendante, utilise désormais les couleurs du thème
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '500',
  },
});