import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import WeatherCard from '../components/ui/WeatherCard';
import ProgressBar from '../components/ui/ProgressBar';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView style={styles.content}>
        <Text style={styles.welcomeTitle}>Bienvenue</Text>

        {/* Weather Card */}
        <WeatherCard temperature={11} windSpeed={40} condition="pluvieux" visibility={3} />

        {/* Progress Bar */}
        <ProgressBar title="Progression" progress={67} />

        {/* Bottom spacer to prevent content from being hidden by navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background, 
      alignItems: 'center',
    },
    content: {
      width: width * 0.94,
      flex: 1,
    },
    welcomeTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.secondaryText, 
      textAlign: 'center',
      marginVertical: 20,
    },
    bottomSpacer: {
      height: 70,
    },
  });
