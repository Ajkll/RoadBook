import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useTheme } from './constants/theme';
import { LineChart } from 'react-native-chart-kit';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotificationsAsync,
  scheduleMotivationalNotification,
} from './utils/notifications';

const screenWidth = Dimensions.get('window').width;

const chartDataSets = {
  weekly: {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    data: [4, 6, 5, 8, 3, 10, 7],
  },
  monthly: {
    labels: ['S1', 'S2', 'S3', 'S4'],
    data: [15, 20, 18, 25],
  },
  yearly: {
    labels: ['Jan', 'Fév', 'Mar', 'Avr'],
    data: [80, 100, 95, 110],
  },
};

const ObjectifScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();

  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [zone, setZone] = useState<'agglomeration' | 'hors-agglomeration'>('agglomeration');
  const [goalKm, setGoalKm] = useState('');
  const [deadline, setDeadline] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadGoalData = async () => {
    try {
      const savedGoalKm = await AsyncStorage.getItem('goalKm');
      const savedGoalDate = await AsyncStorage.getItem('goalDate');

      if (savedGoalKm) setGoalKm(savedGoalKm);
      if (savedGoalDate) setDeadline(new Date(savedGoalDate));
    } catch (error) {
      console.error("Erreur lors du chargement de l'objectif", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGoalData().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    loadGoalData();
  }, []);

  const chartData = {
    labels: chartDataSets[timeRange].labels,
    datasets: [{ data: chartDataSets[timeRange].data }],
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'set' && selectedDate) {
      setDeadline(selectedDate);
    }

    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleAlert = async (frequency: 'daily' | 'weekly') => {
    const kmLeft = 67 - 2000; // TODO: Remplacer 2000 par une vraie donnée
    await registerForPushNotificationsAsync();
    await scheduleMotivationalNotification(Math.max(kmLeft, 0), frequency);
    setSelectedFrequency(frequency);
    alert(
      `Notification programmée ${frequency === 'daily' ? 'quotidiennement' : 'hebdomadairement'} !`
    );
  };

  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekly' | null>(null);

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primaryText}
        />
      }
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.primaryText} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primaryText }]}>Progression</Text>
        </View>
        <View style={styles.cardSection}>
          {/* Filtres */}
          <View style={styles.filterButtonsContainer}>
            {['agglomeration', 'hors-agglomeration'].map((value) => (
              <TouchableOpacity
                key={value}
                style={[styles.filterButton, zone === value && styles.activeButton]}
                onPress={() => setZone(value as typeof zone)}
              >
                <Text style={[styles.filterButtonText, zone === value && styles.activeButtonText]}>
                  {value === 'agglomeration' ? 'Agglomération' : 'Hors agglomération'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.filterButtonsContainer}>
            {[
              { label: 'Semaine', value: 'weekly' },
              { label: 'Mois', value: 'monthly' },
              { label: 'Année', value: 'yearly' },
            ].map(({ label, value }) => (
              <TouchableOpacity
                key={value}
                style={[styles.rangeButton, timeRange === value && styles.activeButton]}
                onPress={() => setTimeRange(value as typeof timeRange)}
              >
                <Text
                  style={[styles.rangeButtonText, timeRange === value && styles.activeButtonText]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Graphique */}
          <View style={{ alignItems: 'center' }}>
            <LineChart
              data={chartData}
              width={screenWidth - 70}
              height={250}
              chartConfig={{
                backgroundColor: colors.background,
                backgroundGradientFrom: colors.background,
                backgroundGradientTo: colors.background,
                decimalPlaces: 0,
                color: () => '#ffff',
                labelColor: () => colors.primaryText,
              }}
              style={styles.chart}
            />
          </View>
        </View>
        {/* Objectif */}
        <View style={styles.cardSection}>
          <Text style={styles.cardTitle}>Définir un objectif</Text>
          <TextInput
            value={goalKm}
            onChangeText={setGoalKm}
            placeholder="🎯 Objectif en kilomètres"
            placeholderTextColor="#fff"
            keyboardType="numeric"
            style={styles.input}
          />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: colors.primaryText }}>
              📅 Date limite : {deadline.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              backgroundColor: '#2B86EE',
              padding: 10,
              borderRadius: 8,
              marginBottom: 20,
              alignItems: 'center',
            }}
            onPress={async () => {
              try {
                await AsyncStorage.setItem('goalKm', goalKm);
                await AsyncStorage.setItem('goalDate', deadline.toISOString());
                alert('objectif enregistré avec succés !');
              } catch (error) {
                console.error("Erreur lors de la sauvegarde de l'objectif", error);
              }
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Enregistrer l'objectif</Text>
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
        {/* Alertes */}
        <View style={styles.cardSection}>
          <Text style={[styles.sectionTitle, { color: colors.primaryText }]}>Alertes</Text>
          <View style={styles.alertBox}>
            <Text style={{ color: colors.primaryText }}>
              Choisissez la fréquence des notifications
            </Text>
            <View style={styles.alertButtonsContainer}>
              <TouchableOpacity
                onPress={() => handleAlert('daily')}
                style={[styles.alertButton, selectedFrequency === 'daily' && styles.activeButton]}
              >
                <Text
                  style={[
                    styles.alertButtonText,
                    selectedFrequency === 'daily' && styles.activeButtonText,
                  ]}
                >
                  Par jour
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleAlert('weekly')}
                style={[styles.alertButton, selectedFrequency === 'weekly' && styles.activeButton]}
              >
                <Text
                  style={[
                    styles.alertButtonText,
                    selectedFrequency === 'weekly' && styles.activeButtonText,
                  ]}
                >
                  Par semaine
                </Text>
              </TouchableOpacity>
            </View>
            {selectedFrequency && (
              <Text style={{ color: colors.primaryText, marginTop: 10 }}>
                Fréquence actuelle :{' '}
                {selectedFrequency === 'daily' ? 'Quotidienne' : 'Hebdomadaire'}
              </Text>
            )}
            <TouchableOpacity
              onPress={async () => {
                setSelectedFrequency(null);
                await AsyncStorage.removeItem('notifFrequency');
                alert('Notifications désactivées.');
              }}
              style={[styles.alertButton, { backgroundColor: '#ffcccc', marginTop: 10 }]}
            >
              <Text style={[styles.alertButtonText, { color: '#a00' }]}>
                Désactiver les alertes
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
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
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rangeButtonText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  activeButton: {
    borderColor: '#2B86EE',
    backgroundColor: '#fff',
  },
  activeButtonText: {
    color: '#2B86EE',
  },
  chart: {},
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    color: '#333',
  },
  dateButton: {
    marginBottom: 30,
  },
  alertBox: {
    borderWidth: 1,
    borderColor: '#ccc',
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
    backgroundColor: '#eee',
  },
  alertButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  cardSection: {
    backgroundColor: '#909090',
    borderRadius: 12,
    padding: 16,
    marginVertical: 15,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
});

export default ObjectifScreen;
