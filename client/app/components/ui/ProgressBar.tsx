// src/components/ui/ProgressBar.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
//import { COLORS } from '../constants/theme';

interface ProgressBarProps {
  title: string;
  progress: number; // Valeur entre 0 et 100
}

const ProgressBar: React.FC<ProgressBarProps> = ({ title, progress }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.percentageBubble}>
          <Text style={styles.percentageText}>{progress}%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#7CA7D8", 
    borderRadius: 12,
    padding: 15,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    height: 110,
  },
  cardTitle: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "500",
    marginBottom: 15,
    textAlign: "center",
  },
  progressContainer: {
    alignItems: "center",
  },
  progressBackground: {
    width: "100%",
    height: 20,
    backgroundColor: "#D9D9D9", // Gris clair pour l'arrière-plan
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2B86EE", // Bleu pour la barre de progression
    borderRadius: 10,
  },
  percentageBubble: {
    backgroundColor: "#6B98CC", // Même couleur que la carte
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    bottom: -18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  percentageText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default ProgressBar;
