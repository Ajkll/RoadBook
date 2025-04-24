import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { saveSessionWithOfflineSupport, DriveSessionData } from '../sync/syncManager';

/**
 * Sauvegarde une session de conduite avec support hors ligne intégré : objet json a déstination de firebase
 * Cette fonction est la principale à utiliser depuis l'application et orchestré par ChronoWatcher.tsx
 */
export async function saveDriveSession({
  elapsedTime,
  userId,
  path,
  weather,
  roadInfo,
  vehicle,
}: {
  elapsedTime: number;
  userId: string;
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
      totalDurationMinutes: number; // Durer estimée par l'API
      trafficDelayMinutes: number; // Retard dû au trafic
    };
    roadTypes: Record<string, number>; // Km par type de route
    roadTypesDistribution: Record<string, number>; // Distribution en % des types de routes
    traffic: Record<string, number>; // Km par niveau de trafic
    trafficDistribution: Record<string, number>; // Distribution en % des niveaux de trafic
    urbanRuralDistribution: {
      // Distribution en % urbain/rural
      urban: number;
      rural: number;
      highway: number;
    };
    speed: {
      average: number; // Vitesse moyenne estimée (basé sur la distance de l'api et notre chrono interne a l'app)
    };
    detailedInfo?: {
      matchedPoints?: number;
      matchQuality?: string; // indicateur de qualité de la réponse de l'api de route basé sur matchedPoints
      surfaceTypes?: Record<string, number>;
    };
  } | null;
  vehicle?: 'moto' | 'voiture' | 'camion' | 'camionnette' | null;
}) {
  return saveSessionWithOfflineSupport({
    elapsedTime,
    userId,
    path,
    weather,
    roadInfo,
    vehicle,
  });
}

// to do : Mettre en relation l'objet json avec le modéle relationnel réelle de notre db perso
