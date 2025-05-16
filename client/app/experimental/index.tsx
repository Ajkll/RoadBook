// client/app/experimental/index.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { useRouter } from 'expo-router';

export default function ExperimentalIndex() {
  const { user, isAuthenticated, login, logout } = useSimpleAuth();
  const router = useRouter();

  const handleTestLogin = async () => {
    try {
      await login({
        email: 'test@example.com',
        password: 'password123'
      });
      alert('Connexion réussie!');
    } catch (error) {
      alert(`Erreur de connexion: ${error.message}`);
    }
  };

  const handleTestLogout = async () => {
    try {
      await logout();
      alert('Déconnexion réussie!');
    } catch (error) {
      alert(`Erreur de déconnexion: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zone Expérimentale - Test Auth Simple</Text>
      
      <View style={styles.statusContainer}>
        <Text>Statut: {isAuthenticated ? 'Connecté' : 'Déconnecté'}</Text>
        {user ? (
          <Text>Utilisateur: {user.email}</Text>
        ) : (
          <Text>Aucun utilisateur connecté</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.loginButton]}
          onPress={handleTestLogin}
        >
          <Text style={styles.buttonText}>Tester Connexion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleTestLogout}
        >
          <Text style={styles.buttonText}>Tester Déconnexion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.navButton]}
          onPress={() => router.push('/experimental/test-auth')}
        >
          <Text style={styles.buttonText}>Page Test Auth</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.navButton]}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>Retour Accueil Normal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    backgroundColor: '#F44336',
  },
  navButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});