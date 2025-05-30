import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, ThemeColors } from '../../constants/theme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


interface DistanceProgressBarProps {
  title: string;
  distanceKm: number;
  maxKm?: number;
}

const DistanceProgressBar: React.FC<DistanceProgressBarProps> = ({ 
  title, 
  distanceKm = 0, 
  maxKm = 1500 
}) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [goalKm, setGoalKm] = useState<number | null>(null);
  const [goalDate, setGoalDate] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const loadGoal = async () => {
        const storedKm = await AsyncStorage.getItem('goalKm');
        const storedDate = await AsyncStorage.getItem('goalDate');
        if (storedKm) setGoalKm(Number(storedKm));
        if (storedDate) setGoalDate(storedDate);
      };

      loadGoal();
    }, [])
  );

  // Calcul du pourcentage basé sur maxKm au lieu de goalKm
  const progress = useMemo(() => {
    if (maxKm === 0) return 0;
    return Math.min((distanceKm / maxKm) * 100, 100);
  }, [distanceKm, maxKm]);

  const remainingDays = useMemo(() => {
    if (!goalDate) return null;
    const deadlineDate = new Date(goalDate);
    return Math.max(
      0,
      Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    );
  }, [goalDate]);

  return (
    <TouchableOpacity onPress={() => router.push('/objectives')} activeOpacity={0.8}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBackground}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.percentageBubble}>
            <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
          </View>
        </View>

        <Text style={styles.distanceText}>
          {distanceKm} km parcourus / {maxKm} km
        </Text>

        {/* Affichage du kilomètrage restant */}
        <Text style={styles.remainingText}>
          Restant : {Math.max(0, maxKm - distanceKm)} km
        </Text>

        {goalKm && <Text style={styles.goalText}>🎯 Objectif personnel : {goalKm} km</Text>}
        {goalDate && (
          <Text style={styles.goalText}>
            📅 Jusqu'au : {new Date(goalDate).toLocaleDateString()}
          </Text>
        )}
        {remainingDays !== null && (
          <Text style={styles.goalText}>⏳ Temps restant : {remainingDays} jours</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 15,
      margin: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardTitle: {
      fontSize: 18,
      color: colors.primaryText,
      fontWeight: '500',
      marginBottom: 15,
      textAlign: 'center',
    },
    progressContainer: {
      alignItems: 'center',
    },
    progressBackground: {
      width: '100%',
      height: 20,
      backgroundColor: '#333333', // Fond noir/gris foncé
      borderRadius: 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#2B86EE', // Bleu pour le remplissage
      borderRadius: 10,
    },
    percentageBubble: {
      backgroundColor: colors.primaryDarker,
      borderRadius: 15,
      paddingHorizontal: 10,
      paddingVertical: 5,
      position: 'absolute',
      bottom: -18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    percentageText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
    distanceText: {
      marginTop: 30,
      textAlign: 'center',
      fontSize: 14,
      color: colors.primaryText,
      fontWeight: '600',
    },
    remainingText: {
      marginTop: 5,
      textAlign: 'center',
      fontSize: 13,
      color: colors.primaryText,
      opacity: 0.8,
    },
    goalText: {
      marginTop: 5,
      textAlign: 'center',
      fontSize: 14,
      color: colors.primaryText,
    },
  });

export default DistanceProgressBar;