import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, ThemeColors } from '../../constants/theme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { sessionApi } from '../../services/api/session.api';

interface DistanceProgressBarProps {
  title: string;
}

const DistanceProgressBar: React.FC<DistanceProgressBarProps> = ({ title }) => {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [goalKm, setGoalKm] = useState<number>(0);
  const [goalDate, setGoalDate] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);

  useFocusEffect(
    useCallback(() => {
      const fetchGoalAndDistance = async () => {
        try {
          const storedKm = await AsyncStorage.getItem('goalKm');
          const storedDate = await AsyncStorage.getItem('goalDate');
          if (storedKm) setGoalKm(Number(storedKm));
          if (storedDate) setGoalDate(storedDate);

          // Utilisation de sessionApi.getUserSessions()
          const sessions = await sessionApi.getUserSessions();

          const totalDistance = sessions.reduce((sum, session) => {
            return sum + (session.distance || 0);
          }, 0);

          setDistanceKm(totalDistance);
        } catch (error) {
          console.error('Erreur lors du chargement des données de progression :', error);
        }
      };

      fetchGoalAndDistance();
    }, [])
  );

  const progress = useMemo(() => {
    if (!goalKm || goalKm === 0) return 0;
    return Math.min((distanceKm / goalKm) * 100, 100);
  }, [distanceKm, goalKm]);

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
          {distanceKm} km parcourus {goalKm ? `/ ${goalKm} km` : ''}
        </Text>

        {goalKm !== null && (
          <Text style={styles.remainingText}>
            Restant : {Math.max(0, goalKm - distanceKm).toFixed(1)} km
          </Text>
        )}

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
      backgroundColor: '#333333',
      borderRadius: 10,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#2B86EE',
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
