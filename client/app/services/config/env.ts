import Constants from 'expo-constants';

// ne pas oublier de changer en prod aussi les secrets si les clé api venaient à changés
// interfacage pour sécurisée l'utilisation des variables d'environnement
interface EnvConfig {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_APP_ID: string;
  GEOAPIFY_API_KEY: string;
  GEOAPIFY_API_KEY2: string;
  WEATHER_API_KEY: string;
}

// Valeurs par défaut pour le développement (à ne pas utiliser en production)
const fallbackValues: EnvConfig = {
  FIREBASE_API_KEY: '',
  FIREBASE_AUTH_DOMAIN: '',
  FIREBASE_APP_ID: '',
  GEOAPIFY_API_KEY: '',
  GEOAPIFY_API_KEY2: '',
  WEATHER_API_KEY: '',
};

// récup depuis constants.expoConfig.extra
const getEnv = (): EnvConfig => {
  const extra = Constants.expoConfig?.extra;

  if (!extra) {
    console.warn('Constants.expoConfig.extra n\'est pas disponible');
    return fallbackValues;
  }

  return {
    FIREBASE_API_KEY: extra.FIREBASE_API_KEY || fallbackValues.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: extra.FIREBASE_AUTH_DOMAIN || fallbackValues.FIREBASE_AUTH_DOMAIN,
    FIREBASE_APP_ID: extra.FIREBASE_APP_ID || fallbackValues.FIREBASE_APP_ID,
    GEOAPIFY_API_KEY: extra.GEOAPIFY_API_KEY || fallbackValues.GEOAPIFY_API_KEY,
    GEOAPIFY_API_KEY2: extra.GEOAPIFY_API_KEY2 || fallbackValues.GEOAPIFY_API_KEY2,
    WEATHER_API_KEY: extra.WEATHER_API_KEY || fallbackValues.WEATHER_API_KEY,
  };
};

export const ENV = getEnv();