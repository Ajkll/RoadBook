// client/app/experimental/test-auth.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import SimpleProtectedRoute from '../components/SimpleProtectedRoute';
import simpleAuthStorage from '../services/simpleAuthStorage';
import { useRouter } from 'expo-router';

export default function TestAuth() {
  return (
    <SimpleProtectedRoute>
      <TestAuthContent />
    </SimpleProtectedRoute>
  );
}

function TestAuthContent() {
  const { user, refreshUserData } = useSimpleAuth();
  const router = useRouter();
  const [storageData, setStorageData] = useState<any>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    // Récupérer les données de stockage pour les afficher
    const data = simpleAuthStorage.getUserData();
    setStorageData(data);
  }, [refreshCount]);

  const handleRefresh = async () => {
    try {
      await refreshUserData();
      setRefreshCount(prev => prev + 1);
      alert('Données utilisateur rafraîchies avec succès!');
    } catch (error) {
      alert(`Erreur de rafraîchissement: ${error.message}`);
    }
  };

  const handleDiagnostic = () => {
    // Afficher les données actuelles de stockage
    const data = simpleAuthStorage.getUserData();
    setStorageData(data);
    setRefreshCount(prev => prev + 1);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Test Auth - Page Protégée</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Utilisateur Actuel:</Text>
        {user ? (
          <>
            <Text>Email: {user.email}</Text>
            <Text>Nom: {user.displayName || 'Non défini'}</Text>
            <Text>ID: {user.id}</Text>
            <Text>Rôle: {user.role}</Text>
          </>
        ) : (
          <Text>Aucun utilisateur connecté</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Stockage Simple:</Text>
        {storageData ? (
          <>
            <Text>Token: {storageData.accessToken ? '✅ Présent' : '❌ Absent'}</Text>
            <Text>Refresh Token: {storageData.refreshToken ? '✅ Présent' : '❌ Absent'}</Text>
            <Text>User: {storageData.user ? '✅ Présent' : '❌ Absent'}</Text>
            {storageData.user && (
              <Text>User Email: {storageData.user.email}</Text>
            )}
          </>
        ) : (
          <Text>Aucune donnée de stockage</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.refreshButton]}
          onPress={handleRefresh}
        >
          <Text style={styles.buttonText}>Rafraîchir Données Utilisateur</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.diagnosticButton]}
          onPress={handleDiagnostic}
        >
          <Text style={styles.buttonText}>Diagnostic Stockage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.navButton]}
          onPress={() => router.push('/experimental')}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
  },
  diagnosticButton: {
    backgroundColor: '#FF9800',
  },
  navButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});