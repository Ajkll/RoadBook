import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { sessionApi } from '../services/api/session.api';
import secureStorage from '../services/secureStorage';
import { formatSessionData, validateSessionData, SESSION_CONSTRAINTS } from '../utils/UtilsSessionApi';
import { roadbookApi } from '../services/api/roadbook.api';

// Types pour les sélecteurs
type SelectorOption = {
  label: string;
  value: string;
};

export default function SessionTesterScreen() {
  // États pour les données de session
  const [sessionData, setSessionData] = useState({
    title: "Session de test",
    description: "Session créée depuis l'explorateur",
    date: new Date().toISOString().split('T')[0],
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 3600000).toISOString(),
    startLocation: "Paris, France",
    endLocation: "Lyon, France",
    weather: "CLEAR" as WeatherType,
    daylight: "DAY" as DaylightType,
    sessionType: "PRACTICE" as SessionType,
    roadTypes: ["URBAN"] as RoadType[],
    distance: 50,
    duration: 60,
    notes: "Notes de test",
    roadbookId: "",
    apprenticeId: ""
  });

  // États pour l'UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSelector, setCurrentSelector] = useState<keyof typeof sessionData | null>(null);

  // Charger les données utilisateur au montage
  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { user } = await secureStorage.getAuthData();
      setCurrentUser(user);
      setSessionData(prev => ({
        ...prev,
        apprenticeId: user?.id || ""
      }));

      // Récupérer ou créer un roadbook
      const roadbookId = await sessionApi._ensureRoadbookId();
      setSessionData(prev => ({
        ...prev,
        roadbookId
      }));
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError('Failed to load user data. Please ensure you are logged in.');
    }
  }

  // Gestion des changements de texte
  const handleChange = (field: keyof typeof sessionData, value: string) => {
    setSessionData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Gestion des changements numériques
  const handleNumberChange = (field: keyof typeof sessionData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSessionData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  // Gestion des sélecteurs
  const showSelector = (field: keyof typeof sessionData) => {
    setCurrentSelector(field);
    setModalVisible(true);
  };

  const handleSelect = (value: string) => {
    if (!currentSelector) return;

    if (currentSelector === 'roadTypes') {
      // Gestion spéciale pour les roadTypes (tableau)
      setSessionData(prev => ({
        ...prev,
        roadTypes: [value as RoadType]
      }));
    } else {
      setSessionData(prev => ({
        ...prev,
        [currentSelector]: value
      }));
    }

    setModalVisible(false);
  };

  // Envoi de la session
  const sendSession = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Valider les données
      const validation = validateSessionData(sessionData);
      if (!validation.valid) {
        throw new Error(validation.errors.join('\n'));
      }

      // Formater les données
      const formattedData = formatSessionData(sessionData);
      console.log('Formatted session data:', formattedData);

      // Envoyer à l'API
      const session = await sessionApi.createSession(sessionData.roadbookId, formattedData);

      console.log('Session created successfully:', session);
      setSuccess(`Session créée avec succès! ID: ${session.id}`);
    } catch (err) {
      console.error('Failed to create session:', err);
      setError(err.message || 'Failed to create session. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Options pour les sélecteurs
  const getSelectorOptions = (): SelectorOption[] => {
    if (!currentSelector) return [];

    switch(currentSelector) {
      case 'weather':
        return SESSION_CONSTRAINTS.WEATHER_TYPES.map(type => ({ label: type, value: type }));
      case 'daylight':
        return SESSION_CONSTRAINTS.DAYLIGHT_TYPES.map(type => ({ label: type, value: type }));
      case 'sessionType':
        return SESSION_CONSTRAINTS.SESSION_TYPES.map(type => ({ label: type, value: type }));
      case 'roadTypes':
        return SESSION_CONSTRAINTS.ROAD_TYPES.map(type => ({ label: type, value: type }));
      default:
        return [];
    }
  };

  // Rendu des champs de saisie
  const renderInputField = (label: string, field: keyof typeof sessionData, numeric = false) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={String(sessionData[field])}
        onChangeText={text => numeric ? handleNumberChange(field, text) : handleChange(field, text)}
        keyboardType={numeric ? 'numeric' : 'default'}
      />
    </View>
  );

  // Rendu des sélecteurs
  const renderSelectorField = (label: string, field: keyof typeof sessionData, value: string) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => showSelector(field)}
      >
        <Text style={styles.selectorButtonText}>{value}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Testeur de Session</Text>
        <Text style={styles.subtitle}>Envoyer des données de session à la DB</Text>
      </View>

      {currentUser ? (
        <View style={styles.userInfo}>
          <Text style={styles.infoText}>Connecté en tant que: {currentUser.displayName || currentUser.email}</Text>
          <Text style={styles.infoText}>Roadbook ID: {sessionData.roadbookId || 'Chargement...'}</Text>
        </View>
      ) : (
        <Text style={styles.warningText}>Non connecté. Veuillez vous connecter pour utiliser cette fonctionnalité.</Text>
      )}

      {/* Formulaire de session */}
      <View style={styles.formContainer}>
        {renderInputField('Titre', 'title')}
        {renderInputField('Description', 'description')}
        {renderInputField('Date (YYYY-MM-DD)', 'date')}
        {renderInputField('Heure de début', 'startTime')}
        {renderInputField('Heure de fin', 'endTime')}
        {renderInputField('Lieu de départ', 'startLocation')}
        {renderInputField('Lieu d\'arrivée', 'endLocation')}

        {renderSelectorField('Météo', 'weather', sessionData.weather)}
        {renderSelectorField('Luminosité', 'daylight', sessionData.daylight)}
        {renderSelectorField('Type de session', 'sessionType', sessionData.sessionType)}
        {renderSelectorField('Type de route', 'roadTypes', sessionData.roadTypes[0])}

        {renderInputField('Distance (km)', 'distance', true)}
        {renderInputField('Durée (minutes)', 'duration', true)}
        {renderInputField('Notes', 'notes')}
      </View>

      {/* Bouton d'envoi */}
      <TouchableOpacity
        style={[styles.button, loading && styles.disabledButton]}
        onPress={sendSession}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Envoi en cours...' : 'Envoyer la Session'}
        </Text>
      </TouchableOpacity>

      {/* Messages d'erreur/succès */}
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

      {/* Modal pour les sélecteurs */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une option</Text>

            {getSelectorOptions().map(option => (
              <Pressable
                key={option.value}
                style={styles.optionButton}
                onPress={() => handleSelect(option.value)}
              >
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}

            <Pressable
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  userInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#e9f7ef',
    borderRadius: 8,
  },
  warningText: {
    color: '#d32f2f',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  selectorButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 15,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 80,
  },
  disabledButton: {
    backgroundColor: '#a0c4ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  errorText: {
    color: '#d32f2f',
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 6,
  },
  successText: {
    color: '#388e3c',
    backgroundColor: '#e8f5e9',
    padding: 10,
    borderRadius: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  optionButton: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
});