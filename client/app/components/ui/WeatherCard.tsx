// src/components/ui/WeatherCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

// Pour un composant statique, nous définissons les propriétés directement
// Dans une application réelle, ces données viendraient d'une API météo
interface WeatherCardProps {
  temperature?: number;
  windSpeed?: number;
  condition?: string;
  visibility?: number;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  temperature = 11,
  windSpeed = 40,
  condition = "pluvieux",
  visibility = 3,
}) => {
  const { colors } = useTheme();  // Utilisation du hook useTheme pour accéder aux couleurs

  const styles = createStyles(colors); // Application des couleurs dynamiquement aux styles

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Météo</Text>

      <View style={styles.weatherGrid}>
        {/* Température */}
        <View style={styles.weatherItem}>
          <Ionicons name="thermometer" size={24} color={colors.primaryIcon} style={styles.weatherIcon} />
          <Text style={styles.weatherValue}>{temperature} °C</Text>
        </View>

        {/* Vitesse du vent */}
        <View style={styles.weatherItem}>
          <MaterialIcons name="air" size={24} color={colors.primaryIcon} style={styles.weatherIcon} />
          <Text style={styles.weatherValue}>{windSpeed} km/h</Text>
        </View>

        {/* Condition météo */}
        <View style={styles.weatherItem}>
          <Ionicons name="cloud" size={24} color={colors.primaryIcon} style={styles.weatherIcon} />
          <Text style={styles.weatherValue}>{condition}</Text>
        </View>

        {/* Visibilité */}
        <View style={styles.weatherItem}>
          <Ionicons name="eye" size={24} color={colors.primaryIcon} style={styles.weatherIcon} />
          <Text style={styles.weatherValue}>{visibility} km</Text>
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 15,
      margin: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      color: colors.primaryText,
      fontWeight: "500",
      marginBottom: 25,
      textAlign: "center",
    },
    weatherGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    weatherItem: {
      width: "48%",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 15,
    },
    weatherIcon: {
      fontSize: 24,
      marginRight: 8,
      color: colors.primaryIcon, 
    },
    weatherValue: {
      fontSize: 16,
      color: colors.primaryText,
    },
  });

export default WeatherCard;
