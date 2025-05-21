import { SessionData, WeatherType, DaylightType, SessionType, RoadType, SessionStatus, Waypoint } from '../types/session.types';
import { reverseGeocode } from '../services/api/geocoding.api';
import { roadbookApi } from '../services/api/roadbook.api';

export const SESSION_CONSTRAINTS = {
  WEATHER_TYPES: ['CLEAR', 'CLOUDY', 'RAINY', 'SNOWY', 'FOGGY', 'WINDY', 'OTHER'] as WeatherType[],
  DAYLIGHT_TYPES: ['DAY', 'NIGHT', 'DAWN_DUSK'] as DaylightType[],
  SESSION_TYPES: ['PRACTICE', 'EXAM', 'LESSON'] as SessionType[],
  SESSION_STATUS: ['PENDING', 'VALIDATED', 'REJECTED'] as SessionStatus[],
  ROAD_TYPES: ['URBAN', 'HIGHWAY', 'RURAL', 'MOUNTAIN', 'RESIDENTIAL', 'OTHER'] as RoadType[],
  MIN_DURATION: 1, // minutes
  MAX_DURATION: 720, // 12 hours
  MIN_DISTANCE: 0.1, // km
  MAX_DISTANCE: 10000, // km
};

// Validate the session data before sending to API
export const validateSessionData = (sessionData: SessionData): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!sessionData.date) {
    errors.push('Date is required');
  }

  if (!sessionData.startTime) {
    errors.push('Start time is required');
  }

  if (!sessionData.roadbookId) {
    errors.push('Roadbook ID is required');
  }

  // Type validations
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

  // Numeric validations
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

  // Waypoints validation
  if (sessionData.routeData?.waypoints) {
    for (const waypoint of sessionData.routeData.waypoints) {
      if (waypoint.lat === undefined || waypoint.lng === undefined) {
        errors.push('All waypoints must have latitude and longitude coordinates');
        break;
      }
      if (typeof waypoint.lat !== 'number' || typeof waypoint.lng !== 'number') {
        errors.push('Waypoint coordinates must be numbers');
        break;
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Format session data for API request
export const formatSessionData = (sessionData: SessionData): SessionData => {
  const formattedData = { ...sessionData };

  // Handle description -> notes conversion
  if (sessionData.description && !sessionData.notes) {
    formattedData.notes = sessionData.description;
  }

  // Ensure proper date formatting (YYYY-MM-DD)
  if (sessionData.date && sessionData.date instanceof Date) {
    formattedData.date = sessionData.date.toISOString().split('T')[0];
  }

  // Ensure proper time formatting (ISO string)
  if (sessionData.startTime && sessionData.startTime instanceof Date) {
    formattedData.startTime = sessionData.startTime.toISOString();
  }

  if (sessionData.endTime && sessionData.endTime instanceof Date) {
    formattedData.endTime = sessionData.endTime.toISOString();
  }

  // Calculate duration if not provided but start and end times are available
  if (!sessionData.duration && sessionData.startTime && sessionData.endTime) {
    const start = new Date(sessionData.startTime);
    const end = new Date(sessionData.endTime);
    formattedData.duration = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
  }

  // Make sure IDs are strings
  if (sessionData.roadbookId) {
    formattedData.roadbookId = String(sessionData.roadbookId);
  }

  if (sessionData.apprenticeId) {
    formattedData.apprenticeId = String(sessionData.apprenticeId);
  }

  if (sessionData.validatorId) {
    formattedData.validatorId = String(sessionData.validatorId);
  }

  // Important: Properly format routeData for API
  if (sessionData.routeData) {
    // If we have path data, convert it to waypoints format for the API
    if (sessionData.routeData.path && Array.isArray(sessionData.routeData.path)) {
      formattedData.routeData = {
        ...sessionData.routeData,
        waypoints: sessionData.routeData.path
      };
      // Remove the path property as API doesn't expect it
      delete formattedData.routeData.path;
    }
  }

  return formattedData;
};

// Generate empty session data template with required fields
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

// Nouvelle fonction pour convertir les données Firebase vers le format SessionData
export const convertDriveSessionToSessionData = async ({
  elapsedTime,
  userId,
  userComment,
  path,
  weather,
  roadInfo,
  vehicle,
}: {
  elapsedTime: number;
  userId: string;
  userComment: string;
  path: { latitude: number; longitude: number }[];
  weather?: {
    temperature: number;
    conditions: string;
    windSpeed: number;
    visibility: number;
    humidity: number;
    pressure: number;
  } | null;
  roadInfo?: {
    summary: {
      totalDistanceKm: number;
      totalDurationMinutes: number;
      trafficDelayMinutes: number;
    };
    roadTypes: Record<string, number>;
    roadTypesDistribution: Record<string, number>;
    traffic: Record<string, number>;
    trafficDistribution: Record<string, number>;
    urbanRuralDistribution: {
      urban: number;
      rural: number;
      highway: number;
    };
    speed: {
      average: number;
    };
    detailedInfo?: {
      matchedPoints?: number;
      matchQuality?: string;
      surfaceTypes?: Record<string, number>;
    };
  } | null;
  vehicle?: 'moto' | 'voiture' | 'camion' | 'camionnette' | null;
}): Promise<SessionData> => {
  // Date actuelle
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const startTime = new Date(now.getTime() - elapsedTime * 1000).toISOString();
  const endTime = now.toISOString();

  // Génération du titre
  const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  const title = `Trajet du ${formattedDate}`;

  // Génération de la description avec les infos météo et route
  let description = `Trajet en ${vehicle || 'véhicule'}\n`;

  if (weather) {
    description += `\nMétéo: ${weather.temperature}°C, ${weather.conditions}, vent: ${weather.windSpeed} km/h, visibilité: ${weather.visibility} km, humidité: ${weather.humidity}%, pression: ${weather.pressure} hPa`;
  }

  if (roadInfo) {
    description += `\n\nRécapitulatif du trajet:\n`;
    description += `Distance: ${roadInfo.summary.totalDistanceKm.toFixed(2)} km\n`;
    description += `Durée estimée: ${roadInfo.summary.totalDurationMinutes.toFixed(2)} min\n`;
    description += `Vitesse moyenne: ${roadInfo.speed.average.toFixed(2)} km/h\n`;

    description += `\nTypes de routes:\n`;
    for (const [type, value] of Object.entries(roadInfo.roadTypesDistribution)) {
      description += `${type}: ${value.toFixed(1)}%\n`;
    }

    description += `\nRépartition urbain/rural:\n`;
    description += `Urbain: ${roadInfo.urbanRuralDistribution.urban.toFixed(1)}%\n`;
    description += `Rural: ${roadInfo.urbanRuralDistribution.rural.toFixed(1)}%\n`;
    description += `Autoroute: ${roadInfo.urbanRuralDistribution.highway.toFixed(1)}%\n`;
  }

  // Convertir les coordonnées en waypoints
  const waypoints: Waypoint[] = path.map(coord => ({
    lat: coord.latitude,
    lng: coord.longitude
  }));

  // Déterminer les emplacements de départ et d'arrivée
  let startLocation = "Lieu inconnu";
  let endLocation = "Lieu inconnu";

  try {
    if (path.length > 0) {
      const firstPoint = path[0];
      startLocation = await reverseGeocode(firstPoint.latitude, firstPoint.longitude);
    }

    if (path.length > 1) {
      const lastPoint = path[path.length - 1];
      endLocation = await reverseGeocode(lastPoint.latitude, lastPoint.longitude);
    }
  } catch (error) {
    console.error('Error during geocoding:', error);
  }

  // Déterminer le type de météo
  let weatherType: WeatherType = 'OTHER';
  if (weather?.conditions) {
    const conditions = weather.conditions.toLowerCase();
    if (conditions.includes('clear') || conditions.includes('sun')) {
      weatherType = 'CLEAR';
    } else if (conditions.includes('cloud') || conditions.includes('partly')) {
      weatherType = 'CLOUDY';
    } else if (conditions.includes('rain') || conditions.includes('shower')) {
      weatherType = 'RAINY';
    } else if (conditions.includes('snow')) {
      weatherType = 'SNOWY';
    } else if (conditions.includes('fog') || conditions.includes('mist')) {
      weatherType = 'FOGGY';
    } else if (conditions.includes('wind')) {
      weatherType = 'WINDY';
    }
  }

  // Déterminer le type de luminosité
  let daylight: DaylightType = 'DAY';
  const hour = now.getHours();

  if (hour >= 6 && hour < 8 || hour >= 18 && hour < 21) {
    daylight = 'DAWN_DUSK';
  } else if (hour >= 21 || hour < 6) {
    daylight = 'NIGHT';
  }

  // Déterminer les types de routes
  const roadTypeMapping: { [key: string]: RoadType } = {
    'urban': 'URBAN',
    'highway': 'HIGHWAY',
    'rural': 'RURAL',
    'mountain': 'MOUNTAIN',
    'residential': 'RESIDENTIAL'
  };

  // Par défaut, on utilise les données de urbanRuralDistribution
  let roadTypes: RoadType[] = ['OTHER'];

  if (roadInfo?.urbanRuralDistribution) {
    const types: RoadType[] = [];
    const distribution = roadInfo.urbanRuralDistribution;

    // On ajoute les types de routes qui représentent plus de 15% du trajet
    if (distribution.urban > 15) types.push('URBAN');
    if (distribution.highway > 15) types.push('HIGHWAY');
    if (distribution.rural > 15) types.push('RURAL');

    // Si on a au moins un type de route
    if (types.length > 0) {
      roadTypes = types;
    }
  }

  // Construction de l'objet SessionData
  const sessionData: SessionData = {
    title,
    description,
    date,
    startTime,
    endTime,
    duration: elapsedTime / 60, // Conversion en minutes
    startLocation,
    endLocation,
    distance: roadInfo?.summary.totalDistanceKm || 0,
    weather: weatherType,
    daylight,
    sessionType: 'PRACTICE', // Par défaut
    roadTypes,
    routeData: {
      waypoints
    },
    apprenticeId: userId,
    roadbookId: '', // À remplir par l'appelant
    notes: userComment,
    status: 'PENDING'
  };

  return sessionData;
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

  // Si aucun type n'a été identifié
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
 * Convertit les coordonnées GPS en waypoints pour la DB
 */
export const pathToWaypoints = (path: { latitude: number; longitude: number }[]): Waypoint[] => {
  if (!path || path.length === 0) return [];

  return path.map(point => ({
    lat: point.latitude,
    lng: point.longitude
  }));
};

/**
 * Fonction principale: Transforme les données Firebase en format SessionData pour la DB
 */
export const mapDriveSessionToSessionData = async ({
  elapsedTime,
  userId,
  userComment,
  path,
  weather,
  roadInfo,
  vehicle
}: {
  elapsedTime: number;
  userId: string;
  userComment: string;
  path: { latitude: number; longitude: number }[];
  weather?: any;
  roadInfo?: any;
  vehicle?: string | null;
}): Promise<SessionData> => {
  // Date actuelle pour les timestamps
  const now = new Date();
  const startTime = new Date(now.getTime() - elapsedTime * 1000);

  // Récupérer les localisations de départ et d'arrivée si le chemin existe
  let startLocation = '';
  let endLocation = '';

  if (path && path.length > 0) {
    try {
      const firstPoint = path[0];
      const lastPoint = path[path.length - 1];

      startLocation = await reverseGeocode(firstPoint.latitude, firstPoint.longitude);
      endLocation = await reverseGeocode(lastPoint.latitude, lastPoint.longitude);
    } catch (error) {
      console.error('Failed to geocode locations:', error);
      // Fallback si le geocoding échoue
      startLocation = 'Localisation inconnue';
      endLocation = 'Localisation inconnue';
    }
  }

  // Déterminer les valeurs pour la DB
  const weatherType = determineWeatherType(weather);
  const daylightType = determineDaylightType(startTime, weather?.visibility);
  const roadTypes = determineRoadTypes(roadInfo);

  // Obtenir un roadbookId (peut être remplacé par la logique dans saveDriveSession)
  let roadbookId = '';
  try {
    const roadbooks = await roadbookApi.getUserRoadbooks('ACTIVE');
    if (roadbooks && roadbooks.length > 0) {
      roadbookId = roadbooks[0].id;
    }
  } catch (error) {
    console.error('Failed to get roadbooks:', error);
  }

  // Convert path to waypoints
  const waypoints = pathToWaypoints(path);

  // Construire l'objet SessionData
  const sessionData: SessionData = {
    title: generateSessionTitle(startTime),
    description: generateSessionDescription(weather, roadInfo, vehicle),
    date: formatDateToISO(startTime),
    startTime: startTime.toISOString(),
    endTime: now.toISOString(),
    duration: elapsedTime / 60, // Convertir secondes en minutes
    startLocation,
    endLocation,
    distance: roadInfo?.summary?.totalDistanceKm || 0,
    weather: weatherType,
    daylight: daylightType,
    sessionType: 'PRACTICE', // Par défaut
    roadTypes: roadTypes,
    routeData: {
        startPoint: startLocation,
        endPoint: endLocation,
        waypoints: waypoints // IMPORTANT: Use waypoints here, not path
    },
    apprenticeId: userId,
    roadbookId: roadbookId,
    notes: userComment,
    status: 'PENDING' // Par défaut
  };

  return sessionData;
};