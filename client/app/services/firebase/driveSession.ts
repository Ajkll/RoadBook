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
    console.log('🔹 Getting roadbook ID before mapping session data...');
    const roadbookId = await sessionApi._ensureRoadbookId();
    console.log('🔹 Got roadbook ID:', roadbookId);

    // 2. Maintenant mapper les données avec le roadbookId
    const sessionData = await mapDriveSessionToSessionData({
      elapsedTime,
      userId,
      userComment,
      path,
      weather,
      roadInfo,
      vehicle,
      roadbookId
    });

    console.log('🔹 Mapped session data:', {
      ...sessionData,
      path: `${path?.length || 0} points`
    });

    // 3. Créer la session dans la DB
    const createdSession = await sessionApi.createSession(roadbookId, sessionData);
    console.log('🔹 Session created successfully:', createdSession.id);

    // 4. Sauvegarder les données GPS lourdes dans Firebase
    const firebaseData = {
      sessionId: createdSession.id, // Référence vers la session DB
      path: path, // Coordonnées GPS (lourdes)
      weather: weather,
      vehicle: vehicle,
      createdAt: Timestamp.now(),
      userId: userId
    };

    const docRef = await addDoc(collection(db, 'driveSessionsGPS'), firebaseData);
    console.log('🔹 GPS data saved to Firebase with ID:', docRef.id);

    return createdSession;
  } catch (error) {
    console.error(' Error saving session:', error);
    throw error;
  }
}