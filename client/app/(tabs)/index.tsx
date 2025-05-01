import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import WeatherCard from '../components/roadbook/WeatherCard';
import ProgressBar from '../components/ui/ProgressBar';
import { getWeather } from '../services/api/weather';
import * as Location from 'expo-location';
import { selectIsConnected, selectIsInternetReachable } from '../store/slices/networkSlice';
import { useSelector } from 'react-redux';

const WEATHER_CONFIG = {
  ONLINE: {
    timePrecisionHours: 4,
    distancePrecisionMeters: 3000,
    refreshIntervalRatio: 0.45,
    maxRefreshIntervalMs: 30 * 60 * 1000,
  },
  OFFLINE: {
    timePrecisionHours: 10,
    distancePrecisionMeters: 8000,
    refreshIntervalRatio: null,
  },
};

export default function HomeScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const { width } = Dimensions.get('window');
  const isConnected = useSelector(selectIsConnected);
  const isInternetReachable = useSelector(selectIsInternetReachable);
  const isOffline = !isConnected || !isInternetReachable;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchWeatherData = async () => {
      try {
        setLoading(true);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') throw new Error('Permission refusée');

        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;

        const config = isOffline ? WEATHER_CONFIG.OFFLINE : WEATHER_CONFIG.ONLINE;
        const timestamp = isOffline ? Date.now() : undefined;

        const weatherData = await getWeather(latitude, longitude, timestamp, {
          timePrecisionHours: config.timePrecisionHours,
          distancePrecisionMeters: config.distancePrecisionMeters,
        });

        setWeather(weatherData || null);
        setLocationError(
          weatherData
            ? null
            : isOffline
              ? 'Aucune donnée récente en cache'
              : 'Erreur de récupération'
        );

        if (!isOffline && config.refreshIntervalRatio) {
          const refreshMs = Math.min(
            config.timePrecisionHours * 60 * 60 * 1000 * config.refreshIntervalRatio,
            config.maxRefreshIntervalMs
          );

          timeoutId = setTimeout(fetchWeatherData, refreshMs);
        }
      } catch (error) {
        setLocationError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();

    return () => clearTimeout(timeoutId);
  }, [isOffline]);

  return (
    <SafeAreaView style={styles.container} edges={['right', 'left']}>
      <ScrollView style={styles.content}>
        <Text style={styles.welcomeTitle}>Bienvenue sur votre RoadBook</Text>

        {/* Weather Card */}
        {locationError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{locationError}</Text>
          </View>
        ) : (
          <WeatherCard
            temperature={weather?.temperature}
            windSpeed={weather?.windSpeed}
            condition={weather?.conditions}
            visibility={weather?.visibility}
            humidity={weather?.humidity}
            loading={loading}
          />
        )}

        {/* Progress Bar non finit*/}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Votre progression</Text>
          <ProgressBar title="Total heures de conduite" progress={67} />
        </View>

        {/* Compétences à travailler non finit */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Compétences à travailler</Text>
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>rien pour le moment.</Text>
          </View>
        </View>

        {/* Bottom spacer to prevent content from being hidden by navigation */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
    },
    content: {
      width: '100%',
      flex: 1,
    },
    welcomeTitle: {
      ...theme.typography.header,
      color: theme.colors.backgroundText,
      textAlign: 'center',
      marginVertical: theme.spacing.lg,
    },
    sectionContainer: {
      marginVertical: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.backgroundText,
      marginBottom: theme.spacing.sm,
    },
    placeholderContainer: {
      backgroundColor: theme.colors.ui.card.background,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.ui.card.border,
    },
    placeholderText: {
      ...theme.typography.body,
      color: theme.colors.backgroundTextSoft,
      opacity: 0.7,
      textAlign: 'center',
    },
    errorContainer: {
      padding: theme.spacing.md,
      backgroundColor: theme.colors.ui.status.error,
      borderRadius: theme.borderRadius.medium,
      marginVertical: theme.spacing.sm,
    },
    errorText: {
      ...theme.typography.body,
      fontWeight: theme.typography.button.fontWeight,
      color: theme.colors.primaryText,
      textAlign: 'center',
    },
    bottomSpacer: {
      height: theme.spacing.xxl,
    },
  });
