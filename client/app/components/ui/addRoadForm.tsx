import React, { useMemo, useState, useRef } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, ThemeColors } from '../../constants/theme';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { db } from '../../services/firebase/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

AddRouteForm.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
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

  const id = useRef<number>(2);

  const sendRoadsData = async (id, roadName, date, duration, distance) => {
    try {
      await addDoc(collection(db, 'roads'), {
        id: id,
        name: roadName,
        date: date,
        duration: duration,
        distance: distance,
      });
    } catch (e) {
      console.error('Erreur lors de l ajout du document : ', e);
    }
  };

  const handleSave = () => {
    const formData = {
      roadName,
      date,
      departureTime,
      arrivalTime,
    };

    console.log('Données du trajet:', formData);
    console.log(formData.date);

    const durationMs = formData.arrivalTime.getTime() - formData.departureTime.getTime();
    const durationMin = Math.floor(durationMs / (1000 * 60));
    // const hours = Math.floor(durationMin / 60);
    // const minutes = durationMin % 60;

    const distance = 10;

    sendRoadsData(id.current, formData.roadName, formData.date, durationMin, distance);
    id.current += 1;

    if (onSave) {
      onSave(formData);
    }

    if (onClose) {
      onClose();
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
            placeholder="Trajet 3"
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

            <TouchableOpacity style={styles.halfWidthInput}>
              <Text style={styles.requiredStar}>*</Text>
              <Text style={styles.inputText}>Distance</Text>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="map-marker-distance"
                  size={28}
                  color={colors.secondaryIcon}
                />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.timePickersContainer}>
            <Text style={styles.requiredStar}>*</Text>
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

          <View style={styles.groupForm}>
            <TouchableOpacity style={styles.halfWidthInput}>
              <Text style={styles.inputText}>Météo</Text>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons
                  name="weather-snowy-rainy"
                  size={30}
                  color={colors.secondaryIcon}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.halfWidthInput}>
              <Text style={styles.inputText}>Moniteur</Text>
              <View style={styles.iconContainer}>
                <MaterialIcons name="person" size={30} color={colors.secondaryIcon} />
              </View>
            </TouchableOpacity>
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
