// src/components/layout/Header.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
//import { COLORS } from '../constants/theme';

const Header = () => {
  return (
    <View style={styles.header}>
      {/* Bouton menu hamburger */}
      <TouchableOpacity style={styles.menuButton}>
        <View style={styles.menuBar}></View>
        <View style={styles.menuBar}></View>
        <View style={styles.menuBar}></View>
      </TouchableOpacity>

      {/* Titre de l'application */}
      <Text style={styles.title}>RoadBook Tracker</Text>

      {/* Espace réservé pour équilibrer le header */}
      <View style={styles.placeholder}></View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60,
    backgroundColor: "#424242", // Couleur gris foncé pour le header
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  menuButton: {
    width: 30,
    height: 25,
    justifyContent: "space-between",
  },
  menuBar: {
    height: 3,
    width: "100%",
    backgroundColor: "#888", // Couleur gris clair pour les barres
    borderRadius: 5,
  },
  title: {
    color: "#ccc", // Couleur gris clair pour le texte
    fontSize: 18,
    fontWeight: "500",
  },
  placeholder: {
    width: 30, // Même largeur que le bouton menu pour équilibrer
  },
});

export default Header;
