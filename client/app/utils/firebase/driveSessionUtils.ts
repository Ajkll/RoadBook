import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase/firebaseConfig';
import { reverseGeocode } from '../../services/api/geocoding.api';
import { logger } from '../../utils/logger';

// Type d'une session pour la cache
export interface DriveSession {
  userId: string;
  elapsedTime: number;
  path: { latitude: number; longitude: number }[];
  weather?: {
    temperature: number;
    conditions: string;
    windSpeed: number;
    visibility: number;
    humidity: number;
    pressure: number;
  } | null;
  vehicle?: 'moto' | 'voiture' | 'camion' | 'camionnette' | null;
  createdAt?: any;
  roadInfo?: {
    summary: {
      totalDistanceKm: number;
      totalDurationMinutes: number;
      trafficDelayMinutes: number;
    };
    speed: {
      average: number;
    };
    // ... on a pas besoind des autres propriétés pour le moment pour notre cache
  };
}

export interface StartEndInfo {
  startAddress: string;
  endAddress: string;
  distance: number;
  averageSpeed: number;
  session: DriveSession;
}

export interface WeatherInfo {
  sessionIndex: number;
  weather: DriveSession['weather'];
}

export function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}min`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(' ');
}

// Distance entre deux points GPS
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

// Distance totale
export function calculatePathDistance(path: { latitude: number; longitude: number }[]): number {
  let totalDistance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    totalDistance += haversineDistance(
      path[i].latitude,
      path[i].longitude,
      path[i + 1].latitude,
      path[i + 1].longitude
    );
  }
  return totalDistance;
}

// pour calculer la vitesse moyenne
export function calculateAverageSpeed(
  path: { latitude: number; longitude: number }[],
  elapsedTimeSeconds: number
): number {
  const distance = calculatePathDistance(path);
  const elapsedTimeHours = elapsedTimeSeconds / 3600;
  return elapsedTimeHours > 0 ? distance / elapsedTimeHours : 0;
}

// pour calculer la vitesse instantanée entre deux points
export function calculateInstantSpeed(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  timeElapsedSeconds: number
): number {
  if (timeElapsedSeconds <= 0) return 0;

  const distanceKm = haversineDistance(lat1, lon1, lat2, lon2);
  const speedKmh = distanceKm / (timeElapsedSeconds / 3600);
  return Math.round(speedKmh * 10) / 10;
}

// pour récupérer les x dérnière session
export async function getLastDriveSessions(count: number): Promise<DriveSession[]> {
  try {
    const q = query(collection(db, 'driveSessions'), orderBy('createdAt', 'desc'), limit(count));
    const querySnapshot = await getDocs(q);

    const sessions: DriveSession[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as DriveSession;
      sessions.push(data);
    });

    return sessions;
  } catch (error) {
    logger.error('Erreur lors de la récupération des sessions:', error);
    return [];
  }
}

export async function getWeatherInfo(count: number): Promise<WeatherInfo[]> {
  const sessions = await getLastDriveSessions(count);
  const results: WeatherInfo[] = [];

  sessions.forEach((session, index) => {
    results.push({
      sessionIndex: index,
      weather: session.weather || null,
    });
  });

  return results;
}

export async function getGpsPoints(
  count: number
): Promise<{ sessionIndex: number; path: DriveSession['path'] }[]> {
  const sessions = await getLastDriveSessions(count);

  return sessions.map((session, index) => ({
    sessionIndex: index,
    path: session.path,
  }));
}

export async function getStartEndInfo(count: number): Promise<StartEndInfo[]> {
  const sessions = await getLastDriveSessions(count);
  const result: StartEndInfo[] = [];

  for (let index = 0; index < sessions.length; index++) {
    const session = sessions[index];
    const path = session.path;

    if (path.length < 2) continue;

    const start = path[0];
    const end = path[path.length - 1];

    const startAddress = await reverseGeocode(start.latitude, start.longitude);
    const endAddress = await reverseGeocode(end.latitude, end.longitude);

    const distance = calculatePathDistance(path);
    const elapsedTimeHours = session.elapsedTime / 3600;
    const averageSpeed = elapsedTimeHours > 0 ? distance / elapsedTimeHours : 0;

    result.push({
      startAddress,
      endAddress,
      distance,
      averageSpeed,
      session,
    });
  }

  return result;
}
