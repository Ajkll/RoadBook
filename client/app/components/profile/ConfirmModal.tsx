import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';

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
  return (
    <Modal
      visible={showConfirmModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowConfirmModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {modalAction === 'logout' ? 'Déconnexion' : 'Suppression du compte'}
          </Text>
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          
          {modalAction === 'delete' && (
            <TextInput
              style={styles.confirmInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Tapez SUPPRIMER"
            />
          )}
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => {
                setShowConfirmModal(false);
                setDeleteConfirmText('');
              }}
            >
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.modalConfirmButton, 
                modalAction === 'delete' ? styles.modalDeleteButton : {}
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: '#ddd',
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
    borderColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
  },
  modalCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  modalConfirmButton: {
    padding: 10,
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#7CA7D8',
    borderRadius: 5,
  },
  modalDeleteButton: {
    backgroundColor: '#FF6B6B',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: '500',
  },
});