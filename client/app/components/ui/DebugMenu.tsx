// client/app/components/ui/DebugMenu.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useRouter } from 'expo-router';

export default function DebugMenu() {
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const navigateTo = (path: string) => {
    setModalVisible(false);
    router.push(path);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.debugButtonText}>🐞</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Menu Développeur</Text>
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigateTo('/experimental')}
            >
              <Text style={styles.menuButtonText}>🧪 Test Auth Simplifié</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                // Diagnostic de stockage
                import('../../services/secureStorage').then(async ({ diagnoseStorage }) => {
                  try {
                    const result = await diagnoseStorage();
                    console.log('=== DIAGNOSTIC STOCKAGE ===', result);
                    alert(`Diagnostic stockage: ${result.status}\nDétails dans la console.`);
                  } catch (e) {
                    console.error('Diagnostic failed', e);
                    alert('Erreur de diagnostic: ' + e.message);
                  }
                });
              }}
            >
              <Text style={styles.menuButtonText}>🔍 Diagnostic Stockage</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => {
                setModalVisible(false);
                // Clear console
                console.clear();
                alert('Console effacée');
              }}
            >
              <Text style={styles.menuButtonText}>🧹 Effacer Console</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuButton, styles.closeButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  debugButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  debugButtonText: {
    fontSize: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  menuButton: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#e0e0e0',
    marginTop: 10,
  },
  closeButtonText: {
    fontWeight: 'bold',
    color: '#333',
  },
});