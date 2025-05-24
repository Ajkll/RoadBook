import { SessionData, WeatherType, DaylightType, SessionType, RoadType, SessionStatus } from '../types/session.types';
import { reverseGeocode } from '../services/api/geocoding.api';
import { roadbookApi } from '../services/api/roadbook.api';
import { calculatePathDistance } from './firebase/driveSessionUtils';

export const SESSION_CONSTRAINTS = {
  WEATHER_TYPES: ['CLEAR', 'CLOUDY', 'RAINY', 'SNOWY', 'FOGGY', 'WINDY', 'OTHER'] as WeatherType[],
  DAYLIGHT_TYPES: ['DAY', 'NIGHT', 'DAWN_DUSK'] as DaylightType[],
  SESSION_TYPES: ['PRACTICE', 'EXAM', 'LESSON'] as SessionType[],
  SESSION_STATUS: ['PENDING', 'VALIDATED', 'REJECTED'] as SessionStatus[],
  ROAD_TYPES: ['URBAN', 'HIGHWAY', 'RURAL', 'MOUNTAIN', 'RESIDENTIAL', 'OTHER'] as RoadType[],
  MIN_DURATION: 1, // minutes
  MAX_DURATION: 720, // minutes
  MIN_DISTANCE: 0.1, // km
  MAX_DISTANCE: 10000, // km
};

// Validate the session data before sending to API
export const validateSessionData = (sessionData: SessionData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!sessionData.date) {
    errors.push('Date is required');
  }

  if (!sessionData.startTime) {
    errors.push('Start time is required');
  }

  if (!sessionData.roadbookId) {
    errors.push('Roadbook ID is required');
  }

  // validation du typage des données
  if (sessionData.weather && !SESSION_CONSTRAINTS.WEATHER_TYPES.includes(sessionData.weather as WeatherType)) {
    errors.push(`Weather type is invalid. Valid types: ${SESSION_CONSTRAINTS.WEATHER_TYPES.join(', ')}`);
  }

  if (sessionData.daylight && !SESSION_CONSTRAINTS.DAYLIGHT_TYPES.includes(sessionData.daylight as DaylightType)) {
    errors.push(`Daylight type is invalid. Valid types: ${SESSION_CONSTRAINTS.DAYLIGHT_TYPES.join(', ')}`);
  }

  if (sessionData.sessionType && !SESSION_CONSTRAINTS.SESSION_TYPES.includes(sessionData.sessionType as SessionType)) {
    errors.push(`Session type is invalid. Valid types: ${SESSION_CONSTRAINTS.SESSION_TYPES.join(', ')}`);
  }

  if (sessionData.status && !SESSION_CONSTRAINTS.SESSION_STATUS.includes(sessionData.status as SessionStatus)) {
    errors.push(`Session status is invalid. Valid types: ${SESSION_CONSTRAINTS.SESSION_STATUS.join(', ')}`);
  }

  // Array validations
  if (sessionData.roadTypes && Array.isArray(sessionData.roadTypes)) {
    for (const roadType of sessionData.roadTypes) {
      if (!SESSION_CONSTRAINTS.ROAD_TYPES.includes(roadType as RoadType)) {
        errors.push(`Road type '${roadType}' is invalid. Valid types: ${SESSION_CONSTRAINTS.ROAD_TYPES.join(', ')}`);
      }
    }
  }

  if (sessionData.duration !== undefined) {
    if (typeof sessionData.duration !== 'number') {
      errors.push('Duration must be a number');
    } else if (sessionData.duration < SESSION_CONSTRAINTS.MIN_DURATION || sessionData.duration > SESSION_CONSTRAINTS.MAX_DURATION) {
      errors.push(`Duration must be between ${SESSION_CONSTRAINTS.MIN_DURATION} and ${SESSION_CONSTRAINTS.MAX_DURATION} minutes`);
    }
  }

  if (sessionData.distance !== undefined) {
    if (typeof sessionData.distance !== 'number') {
      errors.push('Distance must be a number');
    } else if (sessionData.distance < SESSION_CONSTRAINTS.MIN_DISTANCE || sessionData.distance > SESSION_CONSTRAINTS.MAX_DISTANCE) {
      errors.push(`Distance must be between ${SESSION_CONSTRAINTS.MIN_DISTANCE} and ${SESSION_CONSTRAINTS.MAX_DISTANCE} km`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const formatSessionData = (sessionData: SessionData): SessionData => {
  const formattedData = { ...sessionData };

  if (sessionData.description && !sessionData.notes) {
    formattedData.notes = sessionData.description;
  }

  // (YYYY-MM-DD)
  if (sessionData.date && sessionData.date instanceof Date) {
    formattedData.date = sessionData.date.toISOString().split('T')[0];
  }

  // (ISO string)
  if (sessionData.startTime && sessionData.startTime instanceof Date) {
    formattedData.startTime = sessionData.startTime.toISOString();
  }

  if (sessionData.endTime && sessionData.endTime instanceof Date) {
    formattedData.endTime = sessionData.endTime.toISOString();
  }

  if (!sessionData.duration && sessionData.startTime && sessionData.endTime) {
    const start = new Date(sessionData.startTime);
    const end = new Date(sessionData.endTime);
    formattedData.duration = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
  }

  if (sessionData.roadbookId) {
    formattedData.roadbookId = String(sessionData.roadbookId);
  }

  if (sessionData.apprenticeId) {
    formattedData.apprenticeId = String(sessionData.apprenticeId);
  }

  if (sessionData.validatorId) {
    formattedData.validatorId = String(sessionData.validatorId);
  }

  return formattedData;
};

export const createEmptySessionData = (roadbookId: string): SessionData => {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  return {
    date: tomorrow.toISOString().split('T')[0],
    startTime: now.toISOString(),
    roadbookId: roadbookId
  };
};

/**
 * Convertit une date en format ISO 8601 (YYYY-MM-DD)
 */
export const formatDateToISO = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Génère un titre pour la session basé sur la date
 */
export const generateSessionTitle = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return `Trajet du ${date.toLocaleDateString('fr-FR', options)}`;
};

/**
 * Détermine le type de météo basé sur les données de l'API météo
 */
export const determineWeatherType = (weatherData: any): WeatherType => {
  if (!weatherData || !weatherData.conditions) return 'OTHER';

  const condition = weatherData.conditions.toLowerCase();

  if (condition.includes('cloud') || condition.includes('partially')) return 'CLOUDY';
  if (condition.includes('rain') || condition.includes('shower')) return 'RAINY';
  if (condition.includes('snow') || condition.includes('blizzard')) return 'SNOWY';
  if (condition.includes('fog') || condition.includes('mist')) return 'FOGGY';
  if (condition.includes('wind') || weatherData.windSpeed > 20) return 'WINDY';
  if (condition.includes('clear') || condition.includes('sun')) return 'CLEAR';

  return 'OTHER';
};

/**
 * Détermine le type de luminosité basé sur l'heure et la visibilité
 */
export const determineDaylightType = (date: Date, visibility?: number): DaylightType => {
  const hour = date.getHours();

  // Si visibilité très basse, considérer DAWN_DUSK
  if (visibility !== undefined && visibility < 2) return 'DAWN_DUSK';

  // Sinon, basé sur l'heure
  if (hour >= 7 && hour < 20) return 'DAY';
  if (hour >= 5 && hour < 7) return 'DAWN_DUSK';
  if (hour >= 20 && hour < 22) return 'DAWN_DUSK';

  return 'NIGHT';
};

/**
 * Détermine les types de routes basés sur les données de l'API de route
 */
export const determineRoadTypes = (roadInfo: any): RoadType[] => {
  if (!roadInfo || !roadInfo.urbanRuralDistribution) return ['OTHER'];

  const { urban, rural, highway } = roadInfo.urbanRuralDistribution;
  const roadTypes: RoadType[] = [];

  // Ajouter les types de routes selon leur pourcentage
  if (urban > 20) roadTypes.push('URBAN');
  if (rural > 20) roadTypes.push('RURAL');
  if (highway > 20) roadTypes.push('HIGHWAY');

  // Analyser les types de routes détaillés si disponibles
  if (roadInfo.roadTypes) {
    if (roadInfo.roadTypes.residential) roadTypes.push('RESIDENTIAL');
    if (roadInfo.roadTypes.mountain || (roadInfo.roadTypes.tertiary && rural > 50)) roadTypes.push('MOUNTAIN');
  }

  // Si aucun type trouvé
  if (roadTypes.length === 0) roadTypes.push('OTHER');

  return roadTypes;
};

/**
 * Génère une description détaillée de la session basée sur les données météo et de route
 */
export const generateSessionDescription = (
  weather: any,
  roadInfo: any,
  vehicle: string | null | undefined
): string => {
  const parts = [];

  // Informations météo
  if (weather) {
    parts.push(`Météo: ${weather.temperature}°C, ${weather.conditions}`);
    parts.push(`Vent: ${weather.windSpeed} km/h, Visibilité: ${weather.visibility} km`);
  }

  // Informations de route
  if (roadInfo) {
    parts.push(`Distance: ${roadInfo.summary.totalDistanceKm.toFixed(2)} km`);
    if (roadInfo.speed) parts.push(`Vitesse moyenne: ${roadInfo.speed.average.toFixed(2)} km/h`);

    if (roadInfo.urbanRuralDistribution) {
      const { urban, rural, highway } = roadInfo.urbanRuralDistribution;
      parts.push(`Répartition: ${urban.toFixed(0)}% urbain, ${rural.toFixed(0)}% rural, ${highway.toFixed(0)}% autoroute`);
    }
  }

  // Véhicule
  if (vehicle) {
    parts.push(`Véhicule utilisé: ${vehicle}`);
  }

  return parts.join('. ');
};

/**
 * Fonction principale: Transforme les données Firebase en format SessionData pour la DB
 */
export const mapDriveSessionToSessionData = async ({
  elapsedTime,
  userId,
  userComment,
  path = [],
  weather,
  roadInfo,
  vehicle,
  roadbookId
}: {
  elapsedTime: number;
  userId: string;
  userComment: string;
  path?: { latitude: number; longitude: number }[];
  weather?: any;
  roadInfo?: any;
  vehicle?: string | null;
  roadbookId: string;
}): Promise<SessionData> => {
  const now = new Date();
  const startTime = new Date(now.getTime() - elapsedTime * 1000);

  // Calculer la distance
  let startLocation = 'Localisation inconnue';
  let endLocation = 'Localisation inconnue';
  let distance = 0;

  if (roadInfo?.summary?.totalDistanceKm) {
    distance = roadInfo.summary.totalDistanceKm;
  } else if (path && path.length >= 2) {
    // Fallback: calcul manuel si l'API a échoué
    distance = calculatePathDistance(path);
    console.warn('Using fallback distance calculation', distance);
  }

  // Déterminer les valeurs pour la DB
  const weatherType = determineWeatherType(weather);
  const daylightType = determineDaylightType(startTime, weather?.visibility);
  const roadTypes = determineRoadTypes(roadInfo);

  // Construire l'objet SessionData AVEC roadbookId
  const sessionData: SessionData = {
    roadbookId,
    title: generateSessionTitle(startTime),
    description: generateSessionDescription(weather, roadInfo, vehicle),
    date: formatDateToISO(startTime),
    startTime: startTime.toISOString(),
    endTime: now.toISOString(),
    duration: elapsedTime / 60, // Convertir less secondes en minutes
    startLocation,
    endLocation,
    distance: distance,
    weather: weatherType,
    daylight: daylightType,
    sessionType: 'PRACTICE', // Par défaut
    roadTypes: roadTypes,
    apprenticeId: userId,
    notes: userComment,
    status: 'PENDING' // Par défaut
  };

  // Validation avant retour
  const validation = validateSessionData(sessionData);
  if (!validation.valid) {
    console.error('Invalid session data:', validation.errors);
    throw new Error(validation.errors.join(', '));
  }

  console.log('✅ Session data validated successfully');
  return sessionData;
};