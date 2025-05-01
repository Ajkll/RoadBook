// utils/weatherUtils.ts
import { ImageSourcePropType } from 'react-native';
import { WeatherInfo } from '../types/weather.types';

/**
 * Cette fonction dois etre remplacer par la norme de l'api finale pour weather choisie
 */
export const weatherConditionToImage = (condition: string | null | undefined): string => {
  if (!condition) return 'nuageux.png'; // Default
  const normalizedCondition = condition.toLowerCase();
  if (
    normalizedCondition.includes('rain') ||
    normalizedCondition.includes('drizzle') ||
    normalizedCondition.includes('shower') ||
    normalizedCondition.includes('precipitation')
  ) {
    return 'pluvieux.png';
  }

  // thunderstorms
  if (
    normalizedCondition.includes('thunder') ||
    normalizedCondition.includes('storm') ||
    normalizedCondition.includes('lightning')
  ) {
    return 'orage.png';
  }

  // partly cloudy
  if (
    normalizedCondition.includes('partly cloudy') ||
    normalizedCondition.includes('partly-cloudy') ||
    normalizedCondition.includes('partially cloudy') ||
    (normalizedCondition.includes('partly') && normalizedCondition.includes('cloud'))
  ) {
    return 'mi-soleil-mi-nuageux.png';
  }

  // fully clear
  if (
    (normalizedCondition === 'clear' ||
      normalizedCondition === 'sunny' ||
      normalizedCondition === 'fair') &&
    !normalizedCondition.includes('cloud') &&
    !normalizedCondition.includes('partly')
  ) {
    return 'soleil.png';
  }

  // overcast
  if (
    normalizedCondition.includes('cloud') ||
    normalizedCondition.includes('overcast') ||
    normalizedCondition.includes('variablecloud')
  ) {
    return 'nuageux.png';
  }

  // fog/mist
  if (
    normalizedCondition.includes('fog') ||
    normalizedCondition.includes('haze') ||
    normalizedCondition.includes('mist')
  ) {
    return 'brouillard.png';
  }

  // fallBack
  return 'nuageux.png';
};

export const getWeatherImageSource = (
  condition: string | null | undefined
): ImageSourcePropType => {
  const normalizedCondition = condition?.toLowerCase() || '';

  // rain first
  if (
    normalizedCondition.includes('rain') ||
    normalizedCondition.includes('drizzle') ||
    normalizedCondition.includes('shower') ||
    normalizedCondition.includes('precipitation')
  ) {
    return require('../assets/icones/meteo/pluvieux.png');
  }

  // thunder first
  if (
    normalizedCondition.includes('thunder') ||
    normalizedCondition.includes('storm') ||
    normalizedCondition.includes('lightning')
  ) {
    return require('../assets/icones/meteo/orage.png');
  }

  // partly cloudy first
  if (
    normalizedCondition.includes('partly cloudy') ||
    normalizedCondition.includes('partly-cloudy') ||
    normalizedCondition.includes('partially cloudy') ||
    (normalizedCondition.includes('partly') && normalizedCondition.includes('cloud'))
  ) {
    return require('../assets/icones/meteo/mi-soleil-mi-nuageux.png');
  }

  // fully clear first
  if (
    (normalizedCondition === 'clear' ||
      normalizedCondition === 'sunny' ||
      normalizedCondition === 'fair') &&
    !normalizedCondition.includes('cloud') &&
    !normalizedCondition.includes('partly')
  ) {
    return require('../assets/icones/meteo/soleil.png');
  }

  // overcast or cloudy first
  if (
    normalizedCondition.includes('cloud') ||
    normalizedCondition.includes('overcast') ||
    normalizedCondition.includes('variablecloud')
  ) {
    return require('../assets/icones/meteo/nuageux.png');
  }

  // fog/mist first
  if (
    normalizedCondition.includes('fog') ||
    normalizedCondition.includes('haze') ||
    normalizedCondition.includes('mist')
  ) {
    return require('../assets/icones/meteo/brouillard.png');
  }

  // fallBack
  return require('../assets/icones/meteo/nuageux.png');
};

export const getWeatherDescription = (condition: string | null | undefined): string => {
  if (!condition) return 'Conditions inconnues';
  const normalizedCondition = condition.toLowerCase();
  if (normalizedCondition.includes('rain')) {
    return 'Pluie';
  }

  if (normalizedCondition.includes('thunder') || normalizedCondition.includes('storm')) {
    return 'Orage';
  }

  if (
    (normalizedCondition.includes('partly') || normalizedCondition.includes('partially')) &&
    normalizedCondition.includes('cloud')
  ) {
    return 'Partiellement nuageux';
  }

  if (normalizedCondition === 'clear' || normalizedCondition === 'sunny') {
    return 'Ensoleillé';
  }

  if (normalizedCondition.includes('cloud') || normalizedCondition.includes('overcast')) {
    return 'Nuageux';
  }

  if (normalizedCondition.includes('fog') || normalizedCondition.includes('mist')) {
    return 'Brouillard';
  }

  return condition.charAt(0).toUpperCase() + condition.slice(1);
};

/**
 * Formatte les données météo pour affichage
 */
export const formatWeatherData = (weatherData: any) => {
  if (!weatherData) return null;

  return {
    temperature: weatherData.temperature ? Math.round(weatherData.temperature) : undefined,
    conditions: weatherData.conditions || undefined,
    windSpeed: weatherData.windSpeed ? Math.round(weatherData.windSpeed) : undefined,
    visibility: weatherData.visibility ? Math.round(weatherData.visibility) : undefined,
    humidity: weatherData.humidity ? Math.round(weatherData.humidity) : undefined,
    pressure: weatherData.pressure ? Math.round(weatherData.pressure) : undefined,
  };
};

export const weatherToDrivingDifficulty = (condition: string | null | undefined): number => {
  if (!condition) return 3; // Difficulté moyenne par défaut

  const normalizedCondition = condition.toLowerCase();
  if (
    (normalizedCondition === 'clear' ||
      normalizedCondition === 'sunny' ||
      normalizedCondition === 'fair') &&
    !normalizedCondition.includes('cloud')
  ) {
    return 1;
  }

  if (
    normalizedCondition.includes('partly cloudy') ||
    (normalizedCondition.includes('partly') && normalizedCondition.includes('cloud'))
  ) {
    return 2;
  }

  if (normalizedCondition.includes('cloud') || normalizedCondition.includes('overcast')) {
    return 3;
  }

  if (normalizedCondition.includes('rain') || normalizedCondition.includes('drizzle')) {
    return 4;
  }

  if (
    normalizedCondition.includes('fog') ||
    normalizedCondition.includes('mist') ||
    normalizedCondition.includes('thunder') ||
    normalizedCondition.includes('storm')
  ) {
    return 5;
  }

  return 3; // fallBack
};

// to do : utiliser la nomenclature de l'api weather (le json d'une requete api contien l'info icone : xxx) donc pas besoin de guess
