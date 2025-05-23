import { db } from './firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { saveSessionWithOfflineSupport, DriveSessionData } from '../sync/syncManager';
import { sessionApi } from '../api/session.api';
import { mapDriveSessionToSessionData } from '../../utils/UtilsSessionApi';
import { reverseGeocode } from '../api/geocoding.api';
import { store } from '../../store/store';
import { selectIsInternetReachable } from '../../store/slices/networkSlice';

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
  offline,
}: {
  elapsedTime: number;
  userId: string;
  userComment: string;
  offline: boolean;
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
    // verif la co avant tout
    const isOnline = selectIsInternetReachable(store.getState());

    if (!isOnline) {
      // Hors ligne
      console.log('🔹 Mode hors ligne détecté, utilisation du système de sauvegarde hors ligne');
      const sessionData: DriveSessionData = {
        elapsedTime,
        userId,
        userComment,
        path,
        weather,
        roadInfo,
        vehicle,
        offline,
      };

      const sessionId = await saveSessionWithOfflineSupport(sessionData);
      return { id: sessionId }; // Retourner dans le même format que l'API
    }

    // En ligne
    console.log('🔹 Mode en ligne, sauvegarde directe dans la DB');
    console.log('🔹 Getting roadbook ID before mapping session data...');
    const roadbookId = await sessionApi._ensureRoadbookId();
    console.log('🔹 Got roadbook ID:', roadbookId);

    // alors on map
    const sessionData = await mapDriveSessionToSessionData({
      elapsedTime,
      userId,
      userComment,
      path,
      weather,
      roadInfo,
      vehicle,
      roadbookId,
    });

    console.log('🔹 Mapped session data:', {
      ...sessionData,
      path: `${path?.length || 0} points`
    });

    //créer la session dans la DB
    const createdSession = await sessionApi.createSession(roadbookId, sessionData);
    console.log('🔹 Session created successfully:', createdSession.id);

    //save les données GPS lourdes dans Firebase
    const firebaseData = {
      sessionId: createdSession.id, // Référence vers la session DB
      path: path, // Coordonnées GPS (lourdes)
      weather: weather,
      vehicle: vehicle,
      createdAt: Timestamp.now(),
      offline: offline || false,
      userId: userId
    };

    const docRef = await addDoc(collection(db, 'driveSessionsGPS'), firebaseData);
    console.log('🔹 GPS data saved to Firebase with ID:', docRef.id);

    return createdSession;
  } catch (error) {
    console.error(' Error saving session:', error);

    // En cas d'erreur, essayons de sauvegarder hors ligne en mode fallback (l'api publique de notre db etant instable)
    console.log('🔹 Tentative de sauvegarde de secours hors ligne...');
    try {
      const sessionData: DriveSessionData = {
        elapsedTime,
        userId,
        userComment,
        path,
        weather,
        roadInfo,
        vehicle,
      };

      const sessionId = await saveSessionWithOfflineSupport(sessionData);
      console.log('🔹 Session sauvegardée en mode de secours avec ID:', sessionId);
      return { id: sessionId };
    } catch (fallbackError) {
      console.error('Échec de la sauvegarde de secours:', fallbackError);
      throw error; // Relancer l'erreur originale
    }
  }
}