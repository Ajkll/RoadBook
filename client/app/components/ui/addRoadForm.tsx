import React, { useMemo, useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, ThemeColors } from '../../constants/theme';
import { MaterialCommunityIcons, Ionicons, MaterialIcons, Octicons } from '@expo/vector-icons';

export default function AddRouteForm({ visible, onClose, onSave }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [date, setDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeparturePicker, setShowDeparturePicker] = useState(false);
  const [showArrivalPicker, setShowArrivalPicker] = useState(false);

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

          <TextInput
            style={[styles.fullWidthInput, { color: colors.secondaryText }]}
            placeholder="Trajet 3"
            placeholderTextColor="#999"
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
            <TouchableOpacity
              onPress={() => setShowDeparturePicker(true)}
              style={styles.timePicker}
            >
              <Text style={styles.inputText}>
                {departureTime
                  ? departureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Départ'}
              </Text>
              <MaterialIcons name="access-time" size={30} color={colors.secondaryIcon} />
            </TouchableOpacity>

            <Ionicons name="chevron-forward" size={30} color={colors.secondaryDarker} />

            <TouchableOpacity onPress={() => setShowArrivalPicker(true)} style={styles.timePicker}>
              <Text style={styles.inputText}>
                {arrivalTime
                  ? arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Arrivée'}
              </Text>
              <MaterialIcons name="access-time" size={30} color={colors.secondaryIcon} />
            </TouchableOpacity>
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
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={onSave}>
              <Text style={styles.buttonText}>Ajouter</Text>
              <Octicons name="diff-added" size={26} color={colors.primaryText} />
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
      marginBottom: 15,
      color: colors.primaryText,
    },
    fullWidthInput: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      height: 55,
      width: '100%',
      marginBottom: 15,
      paddingHorizontal: 10,
      color: colors.primaryText,
    },
    halfWidthInput: {
      backgroundColor: colors.secondary,
      borderRadius: 10,
      height: 55,
      width: '48%',
      marginBottom: 15,
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
      fontSize: 14,
      marginLeft: 10,
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
      justifyContent: 'space-between',
      width: '100%',
      height: 55,
      marginTop: 10,
    },
    cancelButton: {
      backgroundColor: colors.primaryDarker,
      borderRadius: 10,
      padding: 10,
      width: '40%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButton: {
      backgroundColor: colors.primaryDarker,
      borderRadius: 10,
      padding: 10,
      paddingLeft: 20,
      paddingRight: 20,
      width: '40%',
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
      height: 55,
      width: '100%',
      marginBottom: 15,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    timePicker: {
      backgroundColor: colors.secondaryDark,
      borderRadius: 10,
      height: 45,
      width: '40%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 10,
      paddingLeft: 5,
    },
  });
