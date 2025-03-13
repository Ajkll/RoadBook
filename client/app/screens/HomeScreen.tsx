// src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from "react-native";
import Header from "../components/layout/Header";
import WeatherCard from "../components/ui/WeatherCard";
import ProgressBar from "../components/ui/ProgressBar";
import BottomNavigation from "../components/ui/BottomNavigation";

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Header />

      <ScrollView style={styles.content}>
        <Text style={styles.welcomeTitle}>Bienvenue</Text>

        {/* Carte météo */}
        <WeatherCard
          temperature={11}
          windSpeed={40}
          condition="pluvieux"
          visibility={3}
        />

        {/* Barre de progression */}
        <ProgressBar title="Progression" progress={67} />

        {/* Espace pour que le contenu ne soit pas caché par la navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <BottomNavigation />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#333333", // Fond gris foncé
  },
  content: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#bdbdbd",
    textAlign: "center",
    marginVertical: 20,
  },
  bottomSpacer: {
    height: 70, // Un peu plus que la hauteur de la barre de navigation
  },
});

export default HomeScreen;
