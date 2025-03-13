// src/components/ui/BottomNavigation.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
//import { COLORS } from '../constants/theme';

// Dans une application réelle, nous utiliserions des icônes importées
// Pour ce tutoriel, nous utilisons des émojis comme placeholders
const BottomNavigation = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navItem}>
        <Text style={[styles.navIcon, styles.activeIcon]}>🏠</Text>
        <Text style={[styles.navText, styles.activeText]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Text style={styles.navIcon}>🔍</Text>
        <Text style={styles.navText}>Explorer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.recordButton}>
        <View style={styles.recordIcon}>
          <Text style={styles.recordText}>⏺️</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Text style={styles.navIcon}>🛣️</Text>
        <Text style={styles.navText}>Mes trajets</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem}>
        <Text style={styles.navIcon}>👤</Text>
        <Text style={styles.navText}>Profil</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 60,
    backgroundColor: "#303030",
    borderTopWidth: 1,
    borderTopColor: "#444",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  navIcon: {
    fontSize: 22,
    color: "#888",
    marginBottom: 3,
  },
  navText: {
    fontSize: 12,
    color: "#888",
  },
  activeIcon: {
    color: "#4f89c5", // Bleu actif
  },
  activeText: {
    color: "#4f89c5", // Bleu actif
  },
  recordButton: {
    width: 70,
    justifyContent: "center",
    alignItems: "center",
  },
  recordIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#5c5c5c",
  },
  recordText: {
    fontSize: 24,
  },
});

export default BottomNavigation;
