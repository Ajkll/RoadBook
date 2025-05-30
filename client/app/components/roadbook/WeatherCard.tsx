import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ImageBackground, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { getWeatherImageSource, getWeatherDescription } from '../../utils/weatherUtils';
import { Ionicons } from '@expo/vector-icons';

interface WeatherCardProps {
  temperature?: number;
  windSpeed?: number;
  condition?: string;
  visibility?: number;
  humidity?: number;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  temperature,
  windSpeed,
  condition,
  visibility,
  humidity,
  loading = false,
  error = null,
  onRetry,
}) => {
  const theme = useTheme();
  const styles = createStyles(theme);

  const weatherImage = useMemo(() => getWeatherImageSource(condition), [condition]);
  const weatherDesc = useMemo(() => getWeatherDescription(condition), [condition]);
  
  // Check if we have any meaningful weather data
  const hasData = temperature !== undefined || condition !== undefined;

  // If an error occurred during weather data fetching
  if (error) {
    return (
      <View style={styles.errorCard}>
        <Ionicons name="cloud-offline" size={40} color={theme.colors.error} />
        <Text style={styles.errorTitle}>Données météo indisponibles</Text>
        <Text style={styles.errorText}>{error}</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={16} color={theme.colors.primaryText} />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // If data is still loading
  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={theme.colors.loadingIndicator.activityIndicator} />
        <Text style={styles.loadingText}>Chargement de la météo...</Text>
      </View>
    );
  }

  // If we have no data after loading (but no explicit error)
  if (!hasData) {
    return (
      <View style={styles.errorCard}>
        <Ionicons name="cloudy" size={40} color={theme.colors.text} />
        <Text style={styles.errorTitle}>Données météo indisponibles</Text>
        <Text style={styles.errorText}>Aucune information météo n'a pu être récupérée.</Text>
        {onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Ionicons name="refresh" size={16} color={theme.colors.primaryText} />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Normal state with weather data
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
    errorCard: {
      height: 220,
      borderRadius: theme.borderRadius.medium,
      marginVertical: theme.spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.card,
      padding: theme.spacing.md,
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
    errorTitle: {
      color: theme.colors.error,
      fontSize: theme.typography.title.fontSize,
      fontWeight: 'bold',
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.xs,
      textAlign: 'center',
    },
    errorText: {
      color: theme.colors.text,
      fontSize: theme.typography.body.fontSize,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
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
    retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.small,
      justifyContent: 'center',
      marginTop: theme.spacing.sm,
    },
    retryText: {
      color: theme.colors.primaryText,
      marginLeft: theme.spacing.xs,
      fontSize: theme.typography.body.fontSize,
      fontWeight: '600',
    },
  });

export default WeatherCard;
