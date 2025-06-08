import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from './constants/theme';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotificationsAsync,
  scheduleMotivationalNotification,
} from './utils/notifications';
import { useNotifications } from './components/NotificationHandler';
import { logger } from './utils/logger';
import DistanceChart from './components/ui/DistanceChart';
import WeeklySummary from './components/ui/WeeklySummary';
import { sessionApi } from './services/api';

const ObjectifScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { showSuccess, showInfo, showError } = useNotifications();

  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [zone, setZone] = useState<'agglomeration' | 'hors-agglomeration'>('agglomeration');
  const [goalKm, setGoalKm] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekly' | null>(null);

  const loadGoalData = async () => {
    try {
      const savedGoalKm = await AsyncStorage.getItem('goalKm');
      const savedGoalDate = await AsyncStorage.getItem('goalDate');

      if (savedGoalKm) setGoalKm(savedGoalKm);
      if (savedGoalDate) setDeadline(new Date(savedGoalDate));
    } catch (error) {
      logger.error("Erreur lors du chargement de l'objectif", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGoalData().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    loadGoalData();
  }, []);

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setDeadline(selectedDate);
    }
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleAlert = async (frequency: 'daily' | 'weekly') => {
    try {
      const roadbookId = 'a6222aae-f8aa-4aa9-9fb4-6b3be9385221';
      const sessions = await sessionApi.getUserSessions(roadbookId);
      
      // Total km parcourus durant les sessions
      const totalDistance = sessions.reduce(
        (sum: number, session: any) => sum + (session.distance || 0),
        0
      );

      const goalKmNumber = parseFloat(goalKm);
      if (isNaN(goalKmNumber)) {
        showError("Objectif invalide", "Veuillez enregistrer un objectif valide avant de programmer une alerte.");
        return;
      }

      const kmLeft = goalKmNumber - totalDistance;

      await registerForPushNotificationsAsync();
      await scheduleMotivationalNotification(Math.max(kmLeft, 0), frequency);
      setSelectedFrequency(frequency);
      showInfo(
        'Notification programmée',
        `Vous serez notifié ${frequency === 'daily' ? 'quotidiennement' : 'hebdomadairement'} !`,
        { position: 'bottom', visibilityTime: 4000 }
      );
    } catch (error) {
      logger.error("Erreur lors de la programmation des notifications", error);
      showError(
        "Erreur de notification",
        "Impossible de programmer la notification. Veuillez réessayer."
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primaryText}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft color={"#000000"} size={24} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: "#000000" }]}>Progression</Text>
          </View>
          {/*Résumé de la semaine*/}
          <View style={[styles.cardSection, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Cette semaine
            </Text>
            <WeeklySummary/>
          </View>
          {/* Graphique de distance */}
          <View style={[styles.cardSection, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
              Historique des distances parcourues
            </Text>
            <DistanceChart roadbookId="a6222aae-f8aa-4aa9-9fb4-6b3be9385221 " />
          </View>
          {/* Section Objectif */}
          <View style={[styles.cardSection, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.primary }]}>Définir un objectif de distance (km)</Text>
            <TextInput
              value={goalKm}
              onChangeText={setGoalKm}
              placeholder="Objectif en kilomètres"
              placeholderTextColor={theme.colors.backgroundTextSoft}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.backgroundText,
                  borderColor: theme.colors.border
                }
              ]}
            />
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: theme.colors.primary }}>
                Date limite : {deadline.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.colors.ui.button.primary }
              ]}
              onPress={async () => {
                try {
                  const km = parseFloat(goalKm);
                  if (isNaN(km) || km <= 0) {
                    showError("Objectif invalide", "Veuillez entrer une distance valide en kilomètres.");
                    return;
                  }

                  await AsyncStorage.setItem('goalKm', goalKm);
                  await AsyncStorage.setItem('goalDate', deadline.toISOString());
                  showSuccess(
                    'Objectif enregistré',
                    'Votre objectif a été sauvegardé avec succès',
                    { position: 'bottom', visibilityTime: 3000 }
                  );
                } catch (error) {
                  logger.error("Erreur lors de la sauvegarde de l'objectif", error);
                  showError(
                    'Erreur de sauvegarde',
                    "Une erreur est survenue lors de l'enregistrement de votre objectif."
                  );
                }
              }}
            >
              <Text style={[
                styles.saveButtonText,
                { color: theme.colors.ui.button.primaryText }
              ]}>
                Enregistrer l'objectif
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
          </View>

          {/* Section Alertes */}
          <View style={[styles.cardSection, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Alertes</Text>
            <View style={[
              styles.alertBox,
              { borderColor: theme.colors.border }
            ]}>
              <Text style={{ color: theme.colors.primary }}>
                Choisissez la fréquence des notifications
              </Text>
              <View style={styles.alertButtonsContainer}>
                <TouchableOpacity
                  onPress={() => handleAlert('daily')}
                  style={[
                    styles.alertButton,
                    { backgroundColor: theme.colors.ui.button.primary },
                    selectedFrequency === 'daily' && [
                      styles.activeButton,
                      { borderColor: theme.colors.primary }
                    ]
                  ]}
                >
                  <Text
                    style={[
                      styles.alertButtonText,
                      { color: theme.colors.secondaryText },
                      selectedFrequency === 'daily' && [
                        styles.activeButtonText,
                        { color: theme.colors.primary }
                      ]
                    ]}
                  >
                    Par jour
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAlert('weekly')}
                  style={[
                    styles.alertButton,
                    { backgroundColor: theme.colors.secondary },
                    selectedFrequency === 'weekly' && [
                      styles.activeButton,
                      { borderColor: theme.colors.primary }
                    ]
                  ]}
                >
                  <Text
                    style={[
                      styles.alertButtonText,
                      { color: theme.colors.secondaryText },
                      selectedFrequency === 'weekly' && [
                        styles.activeButtonText,
                        { color: theme.colors.primary }
                      ]
                    ]}
                  >
                    Par semaine
                  </Text>
                </TouchableOpacity>
              </View>
              {selectedFrequency && (
                <Text style={{ color: theme.colors.primaryText, marginTop: 10 }}>
                  Fréquence actuelle :{' '}
                  {selectedFrequency === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}
                </Text>
              )}
              <TouchableOpacity
                onPress={async () => {
                  try {
                    setSelectedFrequency(null);
                    await AsyncStorage.removeItem('notifFrequency');
                    showInfo(
                      'Notifications désactivées',
                      'Vous ne recevrez plus de rappels',
                      { position: 'bottom', visibilityTime: 3000 }
                    );
                  } catch (error) {
                    logger.error("Erreur lors de la désactivation des notifications", error);
                    showError(
                      'Erreur',
                      "Impossible de désactiver les alertes pour le moment."
                    );
                  }
                }}
                style={[
                  styles.alertButton,
                  {
                    backgroundColor: theme.colors.ui.button.danger,
                    marginTop: 10
                  }
                ]}
              >
                <Text style={[
                  styles.alertButtonText,
                  { color: theme.colors.ui.button.dangerText }
                ]}>
                  Désactiver les alertes
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  scrollContent: { paddingBottom: 80 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  filterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonText: {
    fontWeight: '600',
    fontSize: 13,
  },
  activeButton: {
    borderColor: '#2B86EE',
    backgroundColor: '#fff',
  },
  activeButtonText: {
    color: '#2B86EE',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  dateButton: {
    marginBottom: 30,
  },
  alertBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 15,
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  alertButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardSection: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  saveButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: 'bold',
  },
});

export default ObjectifScreen;