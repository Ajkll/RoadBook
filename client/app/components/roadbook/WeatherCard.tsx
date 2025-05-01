import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/theme';
import { getWeatherImageSource, getWeatherDescription } from '../../utils/weatherUtils';

interface WeatherCardProps {
  temperature?: number;
  windSpeed?: number;
  condition?: string;
  visibility?: number;
  humidity?: number;
  loading?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  temperature,
  windSpeed,
  condition,
  visibility,
  humidity,
  loading = false,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const weatherImage = useMemo(() => getWeatherImageSource(condition), [condition]);

  const weatherDesc = useMemo(() => getWeatherDescription(condition), [condition]);

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={theme.colors.loadingIndicator.activityIndicator} />
        <Text style={styles.loadingText}>Chargement de la météo...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={weatherImage} style={styles.card} imageStyle={styles.backgroundImage}>
      <View style={styles.overlay}>
        <View style={styles.innerContainer}>
          <Text style={styles.title}>Conditions météo actuelles</Text>
          <Text style={styles.conditionText}>{weatherDesc}</Text>

          {temperature !== undefined && <Text style={styles.temperatureText}>{temperature}°C</Text>}

          <View style={styles.detailsContainer}>
            {windSpeed !== undefined && (
              <Text style={styles.detailText}>Vent: {windSpeed} km/h</Text>
            )}
            {visibility !== undefined && (
              <Text style={styles.detailText}>Visibilité: {visibility} km</Text>
            )}
            {humidity !== undefined && <Text style={styles.detailText}>Humidité: {humidity}%</Text>}
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

const createStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      height: 220,
      borderRadius: theme.borderRadius.medium,
      marginVertical: theme.spacing.sm,
      overflow: 'hidden',
      backgroundColor: theme.colors.secondary,
      ...theme.shadow.lg,
    },
    loadingCard: {
      height: 220,
      borderRadius: theme.borderRadius.medium,
      marginVertical: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.loadingIndicator.background,
      ...theme.shadow.lg,
    },
    backgroundImage: {
      borderRadius: theme.borderRadius.medium,
      resizeMode: 'cover',
      opacity: 0.85,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      padding: theme.spacing.lg,
      justifyContent: 'center',
    },
    innerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: theme.colors.primaryText,
      fontSize: theme.typography.header.fontSize,
      fontWeight: theme.typography.header.fontWeight,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    conditionText: {
      color: theme.colors.primaryText,
      fontSize: theme.typography.title.fontSize,
      fontWeight: '600',
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    temperatureText: {
      color: theme.colors.primaryText,
      fontSize: 38,
      fontWeight: theme.typography.header.fontWeight,
      marginBottom: theme.spacing.sm,
    },
    detailsContainer: {
      marginTop: theme.spacing.sm,
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    detailText: {
      color: theme.colors.primaryText,
      fontSize: theme.typography.body.fontSize,
    },
    loadingText: {
      color: theme.colors.loadingIndicator.text,
      fontSize: theme.typography.body.fontSize,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
  });

export default WeatherCard;
