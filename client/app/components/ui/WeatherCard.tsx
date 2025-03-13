// src/components/ui/WeatherCard.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

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
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Météo</Text>

      <View style={styles.weatherGrid}>
        {/* Température */}
        <View style={styles.weatherItem}>
          <Text style={styles.weatherIcon}>🌡️</Text>
          <Text style={styles.weatherValue}>{temperature} °C</Text>
        </View>

        {/* Vitesse du vent */}
        <View style={styles.weatherItem}>
          <Text style={styles.weatherIcon}>💨</Text>
          <Text style={styles.weatherValue}>{windSpeed} km/h</Text>
        </View>

        {/* Condition météo */}
        <View style={styles.weatherItem}>
          <Text style={styles.weatherIcon}>☁️</Text>
          <Text style={styles.weatherValue}>{condition}</Text>
        </View>

        {/* Visibilité */}
        <View style={styles.weatherItem}>
          <Text style={styles.weatherIcon}>👁️</Text>
          <Text style={styles.weatherValue}>{visibility} km</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#5d8bb3", // Bleu comme sur l'image
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
    color: "#fff",
    fontWeight: "500",
    marginBottom: 15,
    textAlign: "center",
  },
  weatherGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  weatherItem: {
    width: "48%", // Légèrement moins de 50% pour avoir un petit espace
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  weatherIcon: {
    fontSize: 24,
    marginRight: 8,
    color: "#e0e0e0",
  },
  weatherValue: {
    fontSize: 16,
    color: "#e0e0e0",
  },
});

export default WeatherCard;
