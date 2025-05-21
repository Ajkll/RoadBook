import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Constants from 'expo-constants';
// Import centralized API configuration
import { apiClient, API_URL, API_CONFIG, testApiConnection } from '../services/api/client';

const ApiTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState({
    platform: Platform.OS,
    baseUrl: API_URL,
    tunnelMode: API_CONFIG.IS_PHYSICAL_DEVICE,
    hostUri: Constants.expoConfig?.hostUri || 'non disponible'
  });

  // Mettre à jour les infos de connexion au chargement
  useEffect(() => {
    // Use centralized API configuration
    setConnectionInfo({
      platform: Platform.OS,
      baseUrl: API_URL,
      tunnelMode: API_CONFIG.IS_PHYSICAL_DEVICE,
      hostUri: Constants.expoConfig?.hostUri || 'non disponible'
    });
    
    // Get network info
    const getNetworkInfo = async () => {
      try {
        const state = await NetInfo.fetch();
        setNetworkInfo(state);
        console.log('Network state:', state);
        
        // Log detailed connection info for debugging
        console.log('===== DETAILED CONNECTION INFO =====');
        console.log('Platform:', Platform.OS);
        console.log('API URL:', API_URL);
        console.log('Tunnel Mode:', API_CONFIG.IS_PHYSICAL_DEVICE);
        console.log('Expo Host URI:', Constants.expoConfig?.hostUri);
        console.log('Network Type:', state.type);
        console.log('Is Connected:', state.isConnected);
        console.log('Is Internet Reachable:', state.isInternetReachable);
        console.log('====================================');
      } catch (err) {
        console.error('Error fetching network info:', err);
      }
    };
    
    getNetworkInfo();
  }, []);

  // Tests à effectuer
  const testEndpoints = [
    { name: 'Santé du serveur', path: '/health' },
    { name: 'Statut API', path: '/status' },
    { name: 'Documentation API', path: '/' }
  ];

  // Fonction pour faire un test d'API
  const testEndpoint = async (path) => {
    try {
      setIsLoading(true);
      const fullUrl = `${API_URL}${path}`;
      console.log(`Testing endpoint: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      let responseData = null;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: 'Réponse non-JSON' };
      }
      
      return {
        path,
        success: response.ok,
        status: response.status,
        data: responseData
      };
    } catch (error) {
      console.error(`Test failed for ${path}:`, error);
      return {
        path, 
        success: false,
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Test direct de la connexion API
  const quickTest = async () => {
    setIsLoading(true);
    try {
      const result = await testApiConnection();
      Alert.alert(
        result.success ? 'Connexion réussie' : 'Erreur de connexion',
        result.success 
          ? `Connexion établie à ${API_URL}\nStatus: ${result.status}` 
          : `Erreur: ${result.message || 'Connexion impossible'}`
      );
      console.log('Quick connection test result:', result);
    } catch (err) {
      console.error('Error in quick test:', err);
      Alert.alert('Erreur', `Une erreur est survenue: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Test authentifié avec token (après login)
  const testAuthenticatedEndpoint = async () => {
    setIsLoading(true);
    try {
      // Exemple de test avec le client API configuré
      const response = await apiClient.get('/health');
      Alert.alert(
        'Test API avec client',
        `Succès: ${response.status === 200}\nStatus: ${response.status}\nRéponse: ${JSON.stringify(response.data)}`
      );
    } catch (err) {
      console.error('Error in authenticated test:', err);
      Alert.alert(
        'Erreur test authentifié',
        `Erreur: ${err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour tester tous les endpoints
  const runTests = async () => {
    setTestResults([]);
    const results = [];
    
    for (const test of testEndpoints) {
      const result = await testEndpoint(test.path);
      results.push({
        ...result,
        name: test.name
      });
    }
    
    setTestResults(results);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Test de connexion API</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Informations de connexion:</Text>
        <Text>Plateforme: {connectionInfo.platform}</Text>
        <Text>URL API: {connectionInfo.baseUrl}</Text>
        <Text>Mode Appareil: {connectionInfo.tunnelMode ? '✓ Actif' : '✗ Inactif'}</Text>
        <Text>Host URI: {connectionInfo.hostUri}</Text>
        {networkInfo && (
          <>
            <Text style={styles.infoTitle}>Réseau:</Text>
            <Text>Type: {networkInfo.type}</Text>
            <Text>Connecté: {networkInfo.isConnected ? 'Oui' : 'Non'}</Text>
            {networkInfo.isInternetReachable !== null && (
              <Text>Internet accessible: {networkInfo.isInternetReachable ? 'Oui' : 'Non'}</Text>
            )}
          </>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.quickButton]}
          onPress={quickTest}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            Test rapide
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={runTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Test en cours...' : 'Tester les endpoints'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[styles.button, styles.codespaceButton]}
        onPress={testAuthenticatedEndpoint}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          Test avec client API
        </Text>
      </TouchableOpacity>
      
      <ScrollView style={styles.results}>
        {testResults.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.resultTitle}>{result.name}</Text>
            <Text style={styles.resultPath}>{result.path}</Text>
            <Text style={result.success ? styles.successText : styles.errorText}>
              {result.success 
                ? `✅ Succès (${result.status})` 
                : `❌ Échec: ${result.error || result.status}`}
            </Text>
            {result.success && result.data && (
              <Text style={styles.resultData}>
                {JSON.stringify(result.data, null, 2)}
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#e8f4ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#7CA7D8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  quickButton: {
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  codespaceButton: {
    backgroundColor: '#FF5722',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  results: {
    flex: 1,
  },
  resultItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ddd',
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  resultPath: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultData: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
  },
});

export default ApiTest;