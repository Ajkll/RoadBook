import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../constants/theme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AddRouteForm from '../components/ui/addRoadForm';

const { width } = Dimensions.get('window');

export default function MyRoutes() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSave = () => {
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardsContainer}>
        {[
          { date: '23-03-25', distance: '51km', duration: '1h01' },
          { date: '28-03-25', distance: '40km', duration: '49m' },
        ].map((route, index) => (
          <View key={index} style={styles.roadCard}>
            <MaterialIcons name="person" size={40} color="#D9D9D9" />
            <Text style={styles.text}>{route.date}</Text>
            <Text style={styles.text}>{route.distance}</Text>
            <Text style={styles.text}>{route.duration}</Text>
            <MaterialIcons name="arrow-forward-ios" size={24} color={colors.primaryIcon} />
          </View>
        ))}
      </View>

      <AddRouteForm
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />

      <TouchableOpacity style={styles.addButton}>
        <MaterialIcons
          name="add-box"
          size={40}
          color={colors.primary}
          onPress={() => setModalVisible(true)}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.printButton}>
        <Ionicons
          name="print-outline"
          size={40}
          color={colors.primary}
          onPress={() => router.push('/(tabs)/')}
        />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingTop: 20,
    },
    cardsContainer: {
      alignItems: 'center',
    },
    roadCard: {
      backgroundColor: colors.primary,
      width: width * 0.9,
      height: 100,
      borderRadius: 10,
      paddingHorizontal: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      marginBottom: 20,
    },
    text: {
      fontSize: 16,
      color: colors.primaryText,
    },
    addButton: {
      position: 'absolute',
      bottom: 100,
      left: 45,
    },
    printButton: {
      position: 'absolute',
      bottom: 100,
      right: 45,
    },
  });
