import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { roadbookApi } from '../services/api/roadbook.api';
import secureStorage from '../services/secureStorage';
import { useNavigation } from '@react-navigation/native';

export default function ExplorerScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [roadbookId, setRoadbookId] = useState<string | null>(null);
  const navigation = useNavigation();

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { user } = await secureStorage.getAuthData();
      setCurrentUser(user);

      // Get the user's first active roadbook (if any)
      if (user) {
        const roadbooks = await roadbookApi.getUserRoadbooks('ACTIVE');
        if (roadbooks && roadbooks.length > 0) {
          setRoadbookId(roadbooks[0].id);
          console.log('Found active roadbook:', roadbooks[0].id);
        } else {
          console.log('No active roadbooks found');
        }
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user data. Please ensure you are logged in.');
    }
  }

  const createRoadbook = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Hardcoded roadbook data
      const roadbookData = {
        title: "Test Roadbook " + new Date().toISOString().substring(0, 10),
        description: "Created from Explorer screen for testing",
        targetHours: 50
      };

      const newRoadbook = await roadbookApi.createRoadbook(roadbookData);
      console.log('Roadbook created successfully:', newRoadbook);
      setRoadbookId(newRoadbook.id);
      setSuccess(`Roadbook created successfully with ID: ${newRoadbook.id}`);

      // Refresh roadbooks list
      await loadUserData();
    } catch (err) {
      console.error('Failed to create roadbook:', err);
      setError(`Failed to create roadbook: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const sendHardcodedSession = async () => {
    if (!roadbookId) {
      Alert.alert(
        'No Roadbook Found',
        'Would you like to create a new roadbook first?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Create Roadbook',
            onPress: createRoadbook
          }
        ]
      );
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Données de session corrigées selon le format attendu par l'API et le fichier seed
      const sessionData = {
        date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date().toISOString(), // Current time
        duration: 60, // Duration in minutes
        startLocation: "Rue de la Station 1, 1300 Wavre", // Adresse formatée comme dans le seed
        endLocation: "Avenue des Combattants 10, 1340 Ottignies", // Adresse formatée comme dans le seed
        distance: 4.5, // Distance in km
        weather: "CLEAR", // Valeur d'énumération correcte
        daylight: "DAY", // Valeur d'énumération correcte
        roadTypes: ["URBAN", "HIGHWAY"],
        notes: "This is a test session created from explorer.tsx",
        sessionType: "PRACTICE", // Type de session
        // Ajout des champs manquants d'après le fichier seed
        routeData: {
          waypoints: [
            { lat: 48.856614, lng: 2.3522219, name: "Paris" },
            { lat: 48.858844, lng: 2.294351, name: "Eiffel Tower" },
          ],
        },
        apprenticeId: currentUser?.id, // ID de l'apprenti (utilisateur courant)
        // Si vous avez un ID de validateur/guide, vous pouvez l'ajouter ici
        // validatorId: "GUIDE_ID",
      };

      console.log(`Creating session for roadbook ID: ${roadbookId}`);
      const response = await roadbookApi.createSession(roadbookId, sessionData);

      console.log('Session created successfully:', response);
      setSuccess(`Session created successfully with ID: ${response.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError(`Failed to create session: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testApiConnection = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await roadbookApi.testConnection();
      console.log('API connection test result:', result);

      if (result.status === 'success') {
        setSuccess(`API Connection Successful! Ping time: ${result.details.pingTime}`);
      } else {
        setError(`API Connection Failed: ${result.details.message}`);
      }
    } catch (err) {
      console.error('API test failed:', err);
      setError(`API test failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
        <Text style={styles.subtitle}>Test API Functionality</Text>
      </View>

      {currentUser ? (
        <View style={styles.userInfo}>
          <Text style={styles.infoText}>Logged in as: {currentUser.displayName || currentUser.email}</Text>
          {roadbookId ? (
            <Text style={styles.infoText}>Using Roadbook ID: {roadbookId}</Text>
          ) : (
            <Text style={styles.warningText}>No active roadbook found. You can create one below.</Text>
          )}
        </View>
      ) : (
        <Text style={styles.warningText}>Not logged in. Please log in to use this feature.</Text>
      )}

      <View style={styles.buttonContainer}>
        {!roadbookId && currentUser && (
          <TouchableOpacity
            style={[styles.button, styles.warningButton, loading && styles.disabledButton]}
            onPress={createRoadbook}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Roadbook...' : 'Create Test Roadbook'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, (!currentUser) && styles.disabledButton]}
          onPress={sendHardcodedSession}
          disabled={!currentUser || loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Session...' : 'Create Hardcoded Session'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton, loading && styles.disabledButton]}
          onPress={testApiConnection}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test API Connection</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.messageContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {success && (
        <View style={styles.messageContainer}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.sectionTitle}>Session Details (Hardcoded)</Text>
        <Text style={styles.infoText}>• Date: Today's date</Text>
        <Text style={styles.infoText}>• Duration: 60 minutes</Text>
        <Text style={styles.infoText}>• Start Location: Rue de la Station 1, 1300 Wavre</Text>
        <Text style={styles.infoText}>• End Location: Avenue des Combattants 10, 1340 Ottignies</Text>
        <Text style={styles.infoText}>• Distance: 4.5 km</Text>
        <Text style={styles.infoText}>• Weather: CLEAR</Text>
        <Text style={styles.infoText}>• Daylight: DAY</Text>
        <Text style={styles.infoText}>• Road Types: URBAN, HIGHWAY</Text>
        <Text style={styles.infoText}>• Session Type: PRACTICE</Text>
        <Text style={styles.infoText}>• Route Data: Includes waypoints with lat/lng coordinates</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  userInfo: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonContainer: {
    marginVertical: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#3498db',
  },
  secondaryButton: {
    backgroundColor: '#2ecc71',
  },
  warningButton: {
    backgroundColor: '#f39c12',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  messageContainer: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 16,
  },
  successText: {
    color: '#27ae60',
    fontSize: 16,
  },
  warningText: {
    color: '#e67e22',
    fontSize: 16,
    marginVertical: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 4,
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
});