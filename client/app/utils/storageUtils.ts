import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store/store';
import { selectIsInternetReachable } from '../store/slices/networkSlice';
import { getWeather } from '../services/api/weather';

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

export const savePendingRoadInfoRequest = async (
  request: PendingRoadInfoRequest
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const id = `roadinfo_${timestamp}_${random}`;

    const existingRequests = await getPendingRoadInfoRequests();

    const isDuplicate = existingRequests.some(
      (req) =>
        req.id === id ||
        (req.driveSessionId === request.driveSessionId &&
          JSON.stringify(req.path) === JSON.stringify(request.path))
    );

    if (isDuplicate) {
      console.log('info routière dupliquée donc ignorée');
      const existingRequest = existingRequests.find(
        (req) =>
          req.driveSessionId === request.driveSessionId &&
          JSON.stringify(req.path) === JSON.stringify(request.path)
      );
      return existingRequest ? existingRequest.id : null;
    }

    const newRequest = { ...request, id };
    const updatedRequests = [...existingRequests, newRequest];

    await AsyncStorage.setItem(KEYS.PENDING_ROADINFO_REQUESTS, JSON.stringify(updatedRequests));

    console.log(' info routière en attente sauvegardée:', id);
    return id;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde routière:', error);
    throw error;
  }
};

export const getPendingRoadInfoRequests = async (): Promise<PendingRoadInfoRequest[]> => {
  try {
    const requestsString = await AsyncStorage.getItem(KEYS.PENDING_ROADINFO_REQUESTS);
    return requestsString ? JSON.parse(requestsString) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération routière en attente:', error);
    return [];
  }
};

export const removePendingRoadInfoRequest = async (id: string): Promise<void> => {
  try {
    const requests = await getPendingRoadInfoRequests();
    const updatedRequests = requests.filter((request) => request.id !== id);
    await AsyncStorage.setItem(KEYS.PENDING_ROADINFO_REQUESTS, JSON.stringify(updatedRequests));
    console.log(' info routière supprimée du stockage local:', id);
  } catch (error) {
    console.error('Erreur lors de la suppression info routière:', error);
    throw error;
  }
};

export const savePendingDriveSession = async (
  session: Omit<PendingDriveSession, 'id'>
): Promise<string> => {
  try {
    let id = session.id;

    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    const existingSessions = await getPendingDriveSessions();

    const existingIndex = existingSessions.findIndex((s) => s.id === id);

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
    const updatedSessions = sessions.filter((session) => session.id !== id);
    await AsyncStorage.setItem(KEYS.PENDING_DRIVE_SESSIONS, JSON.stringify(updatedSessions));

    const roadRequests = await getPendingRoadInfoRequests();
    const updatedRoadRequests = roadRequests.filter((req) => req.driveSessionId !== id);
    await AsyncStorage.setItem(KEYS.PENDING_ROADINFO_REQUESTS, JSON.stringify(updatedRoadRequests));

    // 3. delete weather api associées a une session
    const weatherRequests = await getPendingWeatherRequests();
    const updatedWeatherRequests = weatherRequests.filter((req) => req.driveSessionId !== id);
    await AsyncStorage.setItem(
      KEYS.PENDING_WEATHER_REQUESTS,
      JSON.stringify(updatedWeatherRequests)
    );

    console.log(' Session et requetes associées supprimées:', id);
  } catch (error) {
    console.error('Erreur lors de la suppression de la session:', error);
    throw error;
  }
};

export const savePendingWeatherRequest = async (
  request: Omit<PendingWeatherRequest, 'id'>
): Promise<string> => {
  try {
    const id = `weather_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const existingRequests = await getPendingWeatherRequests();
    const newRequest = { ...request, id };
    const updatedRequests = [...existingRequests, newRequest];

    await AsyncStorage.setItem(KEYS.PENDING_WEATHER_REQUESTS, JSON.stringify(updatedRequests));

    console.log('Requete météo en attente sauvegardée:', id);
    return id;
  } catch (error) {
    console.error('erreur lors de la sauvegarde météo:', error);
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
    console.log('sync des données météo impossible: hors ligne');
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  try {
    const pendingRequests = await getPendingWeatherRequests();
    console.log(`${pendingRequests.length} api météo à sync`);

    if (pendingRequests.length === 0) {
      return { success: 0, failed: 0 };
    }

    const pendingSessions = await getPendingDriveSessions();

    for (const request of pendingRequests) {
      try {
        const weather = await getWeather(request.latitude, request.longitude);

        if (!weather) {
          console.error(` resultat defférer api : météo pour la requete ${request.id}`);
          failedCount++;
          continue;
        }
        const sessionIndex = pendingSessions.findIndex((s) => s.id === request.driveSessionId);

        if (sessionIndex >= 0) {
          pendingSessions[sessionIndex].weather = weather;

          await AsyncStorage.setItem(KEYS.PENDING_DRIVE_SESSIONS, JSON.stringify(pendingSessions));
          console.log(`Session ${request.driveSessionId} mise à jour avec les données météo`);
        } else {
          console.log(`Session ${request.driveSessionId} non trouvée localement`);
        }

        await removePendingWeatherRequest(request.id);
        successCount++;
        console.log(`api météo ${request.id} traitée avec succès`);
      } catch (error) {
        console.error(`traitement météo échec ${request.id}:`, error);
        failedCount++;
      }
    }
  } catch (error) {
    console.error('sync des données météo failed:', error);
  }

  return { success: successCount, failed: failedCount };
}

export const getPendingWeatherRequests = async (): Promise<PendingWeatherRequest[]> => {
  try {
    const requestsString = await AsyncStorage.getItem(KEYS.PENDING_WEATHER_REQUESTS);
    return requestsString ? JSON.parse(requestsString) : [];
  } catch (error) {
    console.error('récup api météo en attente failed:', error);
    return [];
  }
};

export const removePendingWeatherRequest = async (id: string): Promise<void> => {
  try {
    const requests = await getPendingWeatherRequests();
    const updatedRequests = requests.filter((request) => request.id !== id);
    await AsyncStorage.setItem(KEYS.PENDING_WEATHER_REQUESTS, JSON.stringify(updatedRequests));
    console.log('api meteo supprimée du stockage local:', id);
  } catch (error) {
    console.error('suppression api météo failed:', error);
    throw error;
  }
};

// Gestion de la date de dernière synchronisation
export const saveLastSyncDate = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(KEYS.LAST_SYNC_DATE, Date.now().toString());
  } catch (error) {
    console.error('stockage de la date de sync failed:', error);
  }
};

export const getLastSyncDate = async (): Promise<number | null> => {
  try {
    const dateString = await AsyncStorage.getItem(KEYS.LAST_SYNC_DATE);
    return dateString ? parseInt(dateString, 10) : null;
  } catch (error) {
    console.error('récup de la date de sync failed:', error);
    return null;
  }
};

export const clearAllStorageData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      KEYS.PENDING_DRIVE_SESSIONS,
      KEYS.PENDING_WEATHER_REQUESTS,
      KEYS.PENDING_ROADINFO_REQUESTS,
      KEYS.LAST_SYNC_DATE,
    ]);
    console.log(' données local effacées');
  } catch (error) {
    console.error('echec de la suppression des données du stockage par clearAll:', error);
  }
};
