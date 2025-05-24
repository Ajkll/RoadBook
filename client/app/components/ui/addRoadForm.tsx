import React, { useMemo, useState, useRef } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, ThemeColors } from '../../constants/theme';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { sessionApi } from '../../services/api';
import { SessionData, WeatherType } from '../../types/session.types';
import { Picker } from '@react-native-picker/picker';
import { useRoads } from '../../context/RoadContext';


AddRouteForm.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  roadbookId: PropTypes.string.isRequired,
};

export default function AddRouteForm({ visible, onClose, onSave }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);

  const [roadName, setRoadName] = useState('');
  const [date, setDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [departureLocation, setDepartureLocation] = useState('');
  const [arrivalLocation, setArrivalLocation] = useState('');
  const [distance, setDistance] = useState('');
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('CLEAR');

  const id = useRef<number>(1);

  const { refreshRoads } = useRoads();

  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // mois commence à 0
    const year = String(date.getFullYear()).slice(2); // deux derniers chiffres de l’année
    return `${day}-${month}-${year}`;
  };

  const handleSave = async () => {
  try {
    const formData = {
      roadName,
      date,
      departureTime,
      arrivalTime,
      departureLocation,
      arrivalLocation,
      distance,
      selectedWeather,
    };

    const formattedDate = date.toISOString().split('T')[0]; // "2025-05-21"
    const durationMs = formData.arrivalTime.getTime() - formData.departureTime.getTime();
    const durationMin = Math.floor(durationMs / (1000 * 60));

    console.log('Données du trajet:', formData);

    // Préparer les données pour l'API
    const sessionData: SessionData = {
      title: formData.roadName,
      description: formData.roadName,
      date: formattedDate,             
      startTime: formData.departureTime.toISOString(),
      endTime: formData.arrivalTime.toISOString(),
      duration: durationMin,
      startLocation: formData.departureLocation, // temporaire parce que title ne fonctionne pas à l'endpoint
      endLocation: formData.arrivalLocation,
      distance: Number(distance),
      weather: selectedWeather || 'CLEAR', 
      daylight: 'DAY',
      sessionType: 'PRACTICE',
      roadTypes: [],
      routeData: {
        waypoints: [
          { lat: 48.8566, lng: 2.3522, name: "Départ" },
          { lat: 45.7640, lng: 4.8357, name: "Arrivée" },
        ]
      },
      apprenticeId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      roadbookId: "a6222aae-f8aa-4aa9-9fb4-6b3be9385221",
      validatorId: "b1c2d3e4-f5a6-7890-bcde-fa1234567890",
      notes: formData.roadName,
      status: 'PENDING',
    };

      // Envoyer les données à l'API en utilisant la fonction importée
      const createdSession = await sessionApi.createSession('', sessionData);
      console.log('Session créée:', createdSession);

      refreshRoads();

      if (onSave) {
        onSave(formData);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      // Afficher l'erreur à l'utilisateur, par exemple avec une alerte
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleDepartureTimeChange = (event, selectedTime) => {
    setShowDeparturePicker(false);
    if (selectedTime) setDepartureTime(selectedTime);
  };

  const handleArrivalTimeChange = (event, selectedTime) => {
    setShowArrivalPicker(false);
    if (selectedTime) setArrivalTime(selectedTime);
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Ajouter un trajet</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Ionicons name="close-outline" size={20} color={colors.secondaryIcon} />
          </TouchableOpacity>

          <TextInput
            style={[styles.fullWidthInput, { color: colors.secondaryText }]}
            placeholder="Nom du trajet"
            placeholderTextColor="#999"
            value={roadName}
            onChangeText={setRoadName}
          />

          <View style={styles.groupForm}>
            <TouchableOpacity style={styles.halfWidthInput} onPress={() => setShowDatePicker(true)}>
              <Text style={styles.inputText}>{date ? date.toLocaleDateString() : 'Date'}</Text>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={30} color={colors.secondaryIcon} />
              </View>
            </TouchableOpacity>

            <View style={styles.halfWidthInput}>
              <Text style={styles.requiredStar}>*</Text>
              <TextInput
                style={[styles.inputText, { color: colors.secondaryText }]}
                placeholder="Distance km"
                placeholderTextColor="#999"
                value={distance} 
                onChangeText={setDistance} 
              />
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={28}
                  color={colors.secondaryIcon}
                />
              </View>
            </View>
          </View>

          <View style={styles.timePickersContainer}>
            <Text style={styles.inputText}>Début</Text>
            <TouchableOpacity
              onPress={() => setShowDeparturePicker(true)}
              style={styles.timePicker}
            >
              <Text style={styles.inputText}>
                {departureTime
                  ? departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Départ'}
              </Text>
            </TouchableOpacity>

            <Ionicons name="chevron-forward" size={30} color={colors.secondaryDarker} />
            <TouchableOpacity onPress={() => setShowArrivalPicker(true)} style={styles.timePicker}>
              <Text style={styles.inputText}>
                {arrivalTime
                  ? arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Arrivée'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.inputText}>Fin</Text>
          </View>

          <View style={styles.timePickersContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Départ"
              placeholderTextColor="#999"
              value={departureLocation}
              onChangeText={setDepartureLocation}
            />
            <Ionicons name="chevron-forward" size={30} color={colors.secondaryDarker} />
            <TextInput
              style={styles.textInput}
              placeholder="Arrivée"
              placeholderTextColor="#999"
              value={arrivalLocation}
              onChangeText={setArrivalLocation}
            />
          </View>

          <View style={styles.groupForm}>
            {/*<TouchableOpacity style={styles.halfWidthInput}>
              <Text style={styles.inputText}>Météo</Text>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="weather-snowy-rainy"
                  size={30}
                  color={colors.secondaryIcon}
                />
              </View>
            </TouchableOpacity>*/}

            <View style={[styles.textInput, styles.fullWidthInput]}>
              <Picker
                selectedValue={selectedWeather}
                onValueChange={(itemValue) => setSelectedWeather(itemValue)}
                style={{ flex: 1, color: colors.secondaryText, fontSize: 13 }} // <-- ici pour le texte sélectionné
                dropdownIconColor={colors.secondaryIcon} // facultatif
              >
                <Picker.Item label="Clair" value="CLEAR" />
                <Picker.Item label="Nuageux" value="CLOUDY" />
                <Picker.Item label="Pluvieux" value="RAINY" />
                <Picker.Item label="Neigeux" value="SNOWY" />
                <Picker.Item label="Brouillard" value="FOGGY" />
                <Picker.Item label="Venteux" value="WINDY" />
                <Picker.Item label="Autre" value="OTHER" />
              </Picker>
            </View>


            {/*
            <TouchableOpacity style={styles.halfWidthInput}>
              <Text style={styles.inputText}>Moniteur</Text>
              <View style={styles.iconContainer}>
                <MaterialIcons name="person" size={30} color={colors.secondaryIcon} />
              </View>
            </TouchableOpacity>*/}
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={handleSave}>
              <Text style={styles.buttonText}>Ajouter</Text>
              <MaterialIcons name="add-box" size={35} color={colors.primaryText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Sélecteur de date */}
      {showDatePicker && (
        <DateTimePicker value={date} mode="date" display="default" onChange={handleDateChange} />
      )}

      {/* Sélecteur d'heure de départ */}
      {showDeparturePicker && (
        <DateTimePicker
          value={departureTime}
          mode="time"
          display="spinner"
          onChange={handleDepartureTimeChange}
        />
      )}

      {/* Sélecteur d'heure d'arrivée */}
      {showArrivalPicker && (
        <DateTimePicker
          value={arrivalTime}
          mode="time"
          display="spinner"
          onChange={handleArrivalTimeChange}
        />
      )}
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalView: {
      width: '90%',
      backgroundColor: colors.primary,
      borderRadius: 20,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 35,
      color: colors.primaryText,
    },
    fullWidthInput: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      height: 60,
      width: '100%',
      marginBottom: 25,
      paddingHorizontal: 10,
      color: colors.primaryText,
    },
    halfWidthInput: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      height: 60,
      width: '45%',
      paddingLeft: 20,
      marginBottom: 25,
      paddingHorizontal: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    textInput:{
      width: '35%',
      color: colors.secondaryText,
    },
    groupForm: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    inputText: {
      color: colors.secondaryText,
      fontSize: 13,
    },
    iconContainer: {
      backgroundColor: colors.secondaryDark,
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    requiredStar: {
      color: colors.red,
      fontSize: 20,
      position: 'absolute',
      left: 5,
      top: 5,
      zIndex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
      height: 60,
      marginTop: 10,
    },
    cancelButton: {
      position: 'absolute',
      top: 15,
      right: 20,
      backgroundColor: colors.primaryDarker,
      borderRadius: 10,
      padding: 10,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      backgroundColor: colors.primaryDarker,
      borderRadius: 10,
      padding: 10,
      paddingLeft: 40,
      paddingRight: 40,
      width: '60%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    buttonText: {
      color: colors.primaryText,
      fontWeight: 'bold',
      marginRight: 5,
    },
    timePickersContainer: {
      backgroundColor: colors.secondary,
      color: colors.primaryText,
      borderRadius: 10,
      height: 60,
      width: '100%',
      marginBottom: 25,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timePicker: {
      backgroundColor: colors.secondaryDark,
      borderRadius: 10,
      height: 45,
      width: '25%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingRight: 5,
      paddingLeft: 5,
    },
  });
