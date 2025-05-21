import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { saveSessionWithOfflineSupport, DriveSessionData } from '../sync/syncManager';
import { sessionApi } from '../api/session.api';
import { mapDriveSessionToSessionData } from '../../utils/UtilsSessionApi';
import { reverseGeocode } from '../api/geocoding.api';

/**
 * Sauvegarde une session de conduite avec support hors ligne intégré
 * Cette fonction est modifiée pour envoyer les données à la DB relationnelle
 * tout en gardant la compatibilité avec l'ancien système Firebase
 */
export async function saveDriveSession({
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
}) {
  try {
    // 1. Sauvegarder dans Firebase pour maintenir la compatibilité
    await saveSessionWithOfflineSupport({
      elapsedTime,
      userId,
      userComment,
      path,
      weather,
      roadInfo,
      vehicle,
    });

    // 2. Transformer les données pour la DB relationnelle
    const sessionData = await mapDriveSessionToSessionData({
      elapsedTime,
      userId,
      userComment,
      path,
      weather,
      roadInfo,
      vehicle,
    });

    if (!sessionData.roadbookId) {
      sessionData.roadbookId = await sessionApi._ensureRoadbookId();
    }
    const createdSession = await sessionApi.createSession(sessionData.roadbookId, sessionData);

    return createdSession;
  } catch (error) {
    console.error('Error saving session to DB:', error);
    throw error;
  }
}