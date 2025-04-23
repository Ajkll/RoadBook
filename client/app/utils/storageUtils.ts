import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { selectIsInternetReachable } from '../store/slices/networkSlice';
import { getWeather } from '../services/api/weather';

// Types
export interface PendingDriveSession {
  id: string;
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
  createdAt: number;
  locationTimestamp: number; // Pour récupérer la météo a posteriori
}

export interface PendingRoadInfoRequest {
  id: string;
  driveSessionId: string;
  path: { latitude: number; longitude: number }[];
  requestedAt: number;
}

const KEYS = {
  PENDING_DRIVE_SESSIONS: 'pending_drive_sessions',
  PENDING_WEATHER_REQUESTS: 'pending_weather_requests',
  PENDING_ROADINFO_REQUESTS: 'pending_roadinfo_requests',
  LAST_SYNC_DATE: 'last_sync_date',
};

export interface PendingWeatherRequest {
  id: string;
  driveSessionId: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  requestedAt: number; // Date de la demande
}

export const savePendingRoadInfoRequest = async (request: PendingRoadInfoRequest): Promise<string> => {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const id = `roadinfo_${timestamp}_${random}`;

    const existingRequests = await getPendingRoadInfoRequests();

    const isDuplicate = existingRequests.some(req => req.id === id ||
      (req.driveSessionId === request.driveSessionId &&
       JSON.stringify(req.path) === JSON.stringify(request.path)));

    if (isDuplicate) {
      console.log(' Tentative d\'ajout d\'une requête d\'info routière dupliquée, ignorée');
      const existingRequest = existingRequests.find(req =>
        req.driveSessionId === request.driveSessionId &&
        JSON.stringify(req.path) === JSON.stringify(request.path));
      return existingRequest ? existingRequest.id : null;
    }

    const newRequest = { ...request, id };
    const updatedRequests = [...existingRequests, newRequest];

    await AsyncStorage.setItem(KEYS.PENDING_ROADINFO_REQUESTS, JSON.stringify(updatedRequests));

    console.log(' Requête d\'info routière en attente sauvegardée:', id);
    return id;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la requête d\'info routière:', error);
    throw error;
  }
};

export const getPendingRoadInfoRequests = async (): Promise<PendingRoadInfoRequest[]> => {
  try {
    const requestsString = await AsyncStorage.getItem(KEYS.PENDING_ROADINFO_REQUESTS);
    return requestsString ? JSON.parse(requestsString) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération des requêtes d\'info routière en attente:', error);
    return [];
  }
};

export const removePendingRoadInfoRequest = async (id: string): Promise<void> => {
  try {
    const requests = await getPendingRoadInfoRequests();
    const updatedRequests = requests.filter(request => request.id !== id);
    await AsyncStorage.setItem(KEYS.PENDING_ROADINFO_REQUESTS, JSON.stringify(updatedRequests));
    console.log(' Requête d\'info routière supprimée du stockage local:', id);
  } catch (error) {
    console.error('Erreur lors de la suppression de la requête d\'info routière:', error);
    throw error;
  }
};

export const savePendingDriveSession = async (session: Omit<PendingDriveSession, 'id'>): Promise<string> => {
  try {
    let id = session.id;

    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const existingSessions = await getPendingDriveSessions();

    const existingIndex = existingSessions.findIndex(s => s.id === id);

    if (existingIndex >= 0) {
      existingSessions[existingIndex] = { ...session, id };
      await AsyncStorage.setItem(KEYS.PENDING_DRIVE_SESSIONS, JSON.stringify(existingSessions));
      console.log(' Session de conduite mise à jour localement:', id);
    } else {
      const newSession = { ...session, id };
      const updatedSessions = [...existingSessions, newSession];
      await AsyncStorage.setItem(KEYS.PENDING_DRIVE_SESSIONS, JSON.stringify(updatedSessions));
      console.log(' Session de conduite sauvegardée localement:', id);
    }

    return id;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde locale de la session:', error);
    throw error;
  }
};

export const getPendingDriveSessions = async (): Promise<PendingDriveSession[]> => {
  try {
    const sessionsString = await AsyncStorage.getItem(KEYS.PENDING_DRIVE_SESSIONS);
    return sessionsString ? JSON.parse(sessionsString) : [];
  } catch (error) {
    console.error(' Erreur lors de la récupération des sessions en attente:', error);
    return [];
  }
};

export const removePendingDriveSession = async (id: string): Promise<void> => {
  try {
    const sessions = await getPendingDriveSessions();
    const updatedSessions = sessions.filter(session => session.id !== id);
    await AsyncStorage.setItem(KEYS.PENDING_DRIVE_SESSIONS, JSON.stringify(updatedSessions));

    const roadRequests = await getPendingRoadInfoRequests();
    const updatedRoadRequests = roadRequests.filter(req => req.driveSessionId !== id);
    await AsyncStorage.setItem(KEYS.PENDING_ROADINFO_REQUESTS, JSON.stringify(updatedRoadRequests));

    // 3. Supprimer les requêtes weather associées
    const weatherRequests = await getPendingWeatherRequests();
    const updatedWeatherRequests = weatherRequests.filter(req => req.driveSessionId !== id);
    await AsyncStorage.setItem(KEYS.PENDING_WEATHER_REQUESTS, JSON.stringify(updatedWeatherRequests));

    console.log(' Session et requêtes associées supprimées:', id);
  } catch (error) {
    console.error('Erreur lors de la suppression de la session:', error);
    throw error;
  }
};

// Fonctions pour les requêtes météo en attente
export const savePendingWeatherRequest = async (request: Omit<PendingWeatherRequest, 'id'>): Promise<string> => {
  try {
    const id = `weather_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const existingRequests = await getPendingWeatherRequests();
    const newRequest = { ...request, id };
    const updatedRequests = [...existingRequests, newRequest];

    await AsyncStorage.setItem(KEYS.PENDING_WEATHER_REQUESTS, JSON.stringify(updatedRequests));

    console.log('☁️ Requête météo en attente sauvegardée:', id);
    return id;
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la requête météo:', error);
    throw error;
  }
};

export async function syncPendingWeatherRequests(): Promise<{
  success: number;
  failed: number;
}> {
  const state = store.getState();
  const isOnline = selectIsInternetReachable(state);

  if (!isOnline) {
    console.log('📴 Synchronisation des données météo impossible: appareil hors ligne');
    return { success: 0, failed: 0 };
  }

  console.log('🔄 Début de la synchronisation des requêtes météo en attente...');

  let successCount = 0;
  let failedCount = 0;

  try {
    // Récupérer toutes les requêtes météo en attente
    const pendingRequests = await getPendingWeatherRequests();
    console.log(`📋 ${pendingRequests.length} requêtes météo à synchroniser`);

    if (pendingRequests.length === 0) {
      return { success: 0, failed: 0 };
    }

    // Récupérer toutes les sessions en attente
    const pendingSessions = await getPendingDriveSessions();

    for (const request of pendingRequests) {
      try {
        console.log(`🔄 Traitement de la requête météo ${request.id}...`);

        // Récupérer les données météo
        const weather = await getWeather(request.latitude, request.longitude);

        if (!weather) {
          console.error(`❌ Impossible d'obtenir les données météo pour la requête ${request.id}`);
          failedCount++;
          continue;
        }

        // Trouver la session associée
        const sessionIndex = pendingSessions.findIndex(s => s.id === request.driveSessionId);

        if (sessionIndex >= 0) {
          // Mettre à jour la session avec les données météo
          pendingSessions[sessionIndex].weather = weather;

          // Sauvegarder les sessions mises à jour
          await AsyncStorage.setItem(KEYS.PENDING_DRIVE_SESSIONS, JSON.stringify(pendingSessions));
          console.log(`✅ Session ${request.driveSessionId} mise à jour avec les données météo`);
        } else {
          console.log(`⚠️ Session ${request.driveSessionId} non trouvée localement`);
        }

        // Supprimer la requête traitée
        await removePendingWeatherRequest(request.id);
        successCount++;
        console.log(`✅ Requête météo ${request.id} traitée avec succès`);
      } catch (error) {
        console.error(`❌ Échec de traitement pour la requête météo ${request.id}:`, error);
        failedCount++;
      }
    }
  } catch (error) {
    console.error('❌ Erreur générale lors de la synchronisation des données météo:', error);
  }

  return { success: successCount, failed: failedCount };
}

export const getPendingWeatherRequests = async (): Promise<PendingWeatherRequest[]> => {
  try {
    const requestsString = await AsyncStorage.getItem(KEYS.PENDING_WEATHER_REQUESTS);
    return requestsString ? JSON.parse(requestsString) : [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des requêtes météo en attente:', error);
    return [];
  }
};

export const removePendingWeatherRequest = async (id: string): Promise<void> => {
  try {
    const requests = await getPendingWeatherRequests();
    const updatedRequests = requests.filter(request => request.id !== id);
    await AsyncStorage.setItem(KEYS.PENDING_WEATHER_REQUESTS, JSON.stringify(updatedRequests));
    console.log('🗑️ Requête météo supprimée du stockage local:', id);
  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la requête météo:', error);
    throw error;
  }
};

// Gestion de la date de dernière synchronisation
export const saveLastSyncDate = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SYNC_DATE, Date.now().toString());
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde de la date de synchronisation:', error);
  }
};

export const getLastSyncDate = async (): Promise<number | null> => {
  try {
    const dateString = await AsyncStorage.getItem(KEYS.LAST_SYNC_DATE);
    return dateString ? parseInt(dateString, 10) : null;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la date de synchronisation:', error);
    return null;
  }
};

export const clearAllStorageData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.PENDING_DRIVE_SESSIONS,
      KEYS.PENDING_WEATHER_REQUESTS,
      KEYS.PENDING_ROADINFO_REQUESTS,
      KEYS.LAST_SYNC_DATE
    ]);
    console.log('🧹 Toutes les données de stockage ont été effacées');
  } catch (error) {
    console.error('❌ Erreur lors de l\'effacement des données de stockage:', error);
  }
};


