import { db } from '../firebase/firebaseConfig';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import {
  PendingDriveSession,
  savePendingDriveSession,
  removePendingDriveSession,
  getPendingDriveSessions,
  saveLastSyncDate,
  PendingRoadInfoRequest,
  PendingWeatherRequest,
} from '../../utils/storageUtils';
import { store } from '../../store/store';
import {
  addPendingItem,
  removePendingItem,
  setSyncing,
  setSyncError,
  clearSyncError,
} from '../../store/slices/syncSlice';
import { selectIsInternetReachable } from '../../store/slices/networkSlice';
import { getGeoapifyRouteInfo } from '../api/getRouteInfo';
import { getWeather } from '../api/weather';
import { useNotifications } from '../../components/NotificationHandler';
import { logger } from '../../utils/logger';
import { sessionApi } from '../api/session.api';
import { mapDriveSessionToSessionData } from '../../utils/UtilsSessionApi';

interface DriveSessionData {
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
}

//interface pour les requêtes roadbook en attente
interface PendingRoadbookRequest {
  id: string;
  driveSessionId: string;
  userId: string;
  requestedAt: number;
}

interface PendingSessionPackage {
  session: PendingDriveSession;
  roadRequest?: PendingRoadInfoRequest;
  weatherRequest?: PendingWeatherRequest;
  roadbookRequest?: PendingRoadbookRequest;
}

/**
 * Sauvegarde une session avec support hors ligne
 */
export async function saveSessionWithOfflineSupport(data: DriveSessionData): Promise<string> {
  const isOnline = selectIsInternetReachable(store.getState());
  const timestamp = Date.now();

  try {
    if (isOnline) {
      // Mode en ligne = sauvegarde directe dans notre DB / firebase
      return await saveOnlineSession(data);
    } else {
      // Mode hors ligne = sauvegarde locale (asyncStorage)
      return await saveOfflineSession(data, timestamp);
    }
  } catch (error) {
    logger.error('Erreur lors de la sauvegarde de session:', error);
    return await handleSaveError(data, timestamp);
  }
}

async function saveOnlineSession(data: DriveSessionData): Promise<string> {
  console.log('Tentative de sauvegarde en ligne...');

  // recup le roadbookId en premier
  const roadbookId = await sessionApi._ensureRoadbookId();

  const [weather, roadInfo] = await Promise.all([
    data.weather ? data.weather : tryGetWeather(data.path),
    data.roadInfo ? data.roadInfo : tryGetRoadInfo(data.path, data.elapsedTime),
  ]);

  const sessionData = await mapDriveSessionToSessionData({
    elapsedTime: data.elapsedTime,
    userId: data.userId,
    userComment: data.userComment,
    path: data.path,
    weather,
    roadInfo,
    vehicle: data.vehicle,
    roadbookId
  });

  // créer la session dans la DB
  const createdSession = await sessionApi.createSession(roadbookId, sessionData);

  // save les données GPS dans Firebase
  const firebaseData = {
    sessionId: createdSession.id,
    path: data.path,
    weather,
    vehicle: data.vehicle,
    createdAt: Timestamp.now(),
    userId: data.userId
  };

  await addDoc(collection(db, 'driveSessionsGPS'), firebaseData);

  console.log('Session sauvegardée en ligne avec ID:', createdSession.id);
  return createdSession.id;
}

async function saveOfflineSession(data: DriveSessionData, timestamp: number): Promise<string> {
  console.log(' Hors ligne: stockage local de la session');
  const sessionPackage = await createPendingSessionPackage(data, timestamp);
  const { showInfo } = useNotifications();
  await saveSessionPackage(sessionPackage);

  showInfo(' Mode hors ligne', 'Trajet sauvegardé localement. Synchronisation automatique à la reconnexion.');

  console.log('Session sauvegardée localement avec ID:', sessionPackage.session.id);
  return sessionPackage.session.id;
}

async function createPendingSessionPackage(
  data: DriveSessionData,
  timestamp: number
): Promise<PendingSessionPackage> {
  const sessionId = `session_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;

  const session: PendingDriveSession = {
    id: sessionId,
    elapsedTime: data.elapsedTime,
    userComment: data.userComment || null,
    offline: data.offline || false,
    userId: data.userId,
    path: data.path,
    weather: data.weather || null,
    roadInfo: data.roadInfo || null,
    vehicle: data.vehicle || null,
    createdAt: timestamp,
    locationTimestamp: timestamp,
  };

  const pkg: PendingSessionPackage = { session };

  pkg.roadbookRequest = {
    id: `roadbook_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
    driveSessionId: sessionId,
    userId: data.userId,
    requestedAt: timestamp,
  };

  if (data.path.length >= 2) {
    pkg.roadRequest = {
      id: `road_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      driveSessionId: sessionId,
      path: data.path,
      requestedAt: timestamp,
    };
  }

  if (data.path.length > 0) {
    const lastPoint = data.path[data.path.length - 1];
    pkg.weatherRequest = {
      id: `weather_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      driveSessionId: sessionId,
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
      timestamp,
      requestedAt: timestamp,
    };
  }

  return pkg;
}

async function saveSessionPackage(pkg: PendingSessionPackage): Promise<void> {
  await savePendingDriveSession(pkg.session);

  if (pkg.roadbookRequest) {
    store.dispatch(
      addPendingItem({
        id: pkg.roadbookRequest.id,
        type: 'api',
        data: pkg.roadbookRequest,
      })
    );
  }

  if (pkg.roadRequest) {
    store.dispatch(
      addPendingItem({
        id: pkg.roadRequest.id,
        type: 'api',
        data: pkg.roadRequest,
      })
    );
  }

  if (pkg.weatherRequest) {
    store.dispatch(
      addPendingItem({
        id: pkg.weatherRequest.id,
        type: 'api',
        data: pkg.weatherRequest,
      })
    );
  }

  // Ajouter la session au store Redux
  store.dispatch(
    addPendingItem({
      id: pkg.session.id,
      type: 'trajet',
      data: pkg.session,
    })
  );
}

async function handleSaveError(data: DriveSessionData, timestamp: number): Promise<string> {
  console.log(' Tentative de sauvegarde de secours suite à une erreur');
  const sessionPackage = await createPendingSessionPackage(data, timestamp);
  await saveSessionPackage(sessionPackage);
  return sessionPackage.session.id;
}

async function tryGetWeather(path: { latitude: number; longitude: number }[]) {
  if (path.length === 0) return null;

  try {
    const lastPoint = path[path.length - 1];
    return await getWeather(lastPoint.latitude, lastPoint.longitude);
  } catch (error) {
    logger.error('Erreur lors de la récupération des données météo:', error);
    return null;
  }
}

async function tryGetRoadInfo(
  path: { latitude: number; longitude: number }[],
  elapsedTime: number
) {
  if (path.length < 2) return null;

  try {
    return await getGeoapifyRouteInfo(path, elapsedTime);
  } catch (error) {
    logger.error('Erreur lors de la récupération des infos de route:', error);
    return null;
  }
}

/**
 * Synchronise toutes les sessions en attente
 */
export async function syncPendingSessions(): Promise<{ success: number; failed: number }> {
  const isOnline = selectIsInternetReachable(store.getState());
  if (!isOnline) {
    return { success: 0, failed: 0 };
  }

  console.log(' Synchronisation des sessions en attente');
  store.dispatch(setSyncing(true));

  try {
    const pendingSessions = await getPendingDriveSessions();
    console.log(`${pendingSessions.length} sessions à synchroniser`);

    if (pendingSessions.length === 0) {
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const session of pendingSessions) {
      try {
        await processSingleSession(session);
        successCount++;
        console.log(` Session ${session.id} synchronisée avec succès`);
      } catch (error) {
        logger.error(` Échec de synchronisation pour la session ${session.id}:`, error);
        store.dispatch(
          setSyncError({
            id: session.id,
            error: error instanceof Error ? error.message : 'Erreur inconnue',
          })
        );
        failedCount++;
      }
    }

    if (successCount > 0) {
      await saveLastSyncDate();
      const { showSuccess } = useNotifications();
      showSuccess(
        ' Synchronisation terminée',
        `${successCount} trajet${successCount > 1 ? 's' : ''} synchronisé${successCount > 1 ? 's' : ''}`
      );
    }

    return { success: successCount, failed: failedCount };
  } finally {
    store.dispatch(setSyncing(false));
  }
}

/**
 * Vérifie et lance une synchronisation si nécessaire
 */
export async function checkAndSync(): Promise<void> {
  const state = store.getState();
  const isOnline = selectIsInternetReachable(state);
  const pendingItems = state.sync.pendingItems;
  const isSyncing = state.sync.syncing;

  if (!isOnline || isSyncing || pendingItems.length === 0) {
    return;
  }

  console.log('Re/Connexion détectée, lancement de la synchronisation');
  await syncPendingSessions();
}

export async function completeSync(): Promise<void> {
  const isOnline = selectIsInternetReachable(store.getState());
  if (!isOnline || store.getState().sync.syncing) {
    return;
  }

  store.dispatch(setSyncing(true));
  console.log(' Synchronisation complète');

  try {
    const sessions = await getPendingDriveSessions();
    if (sessions.length === 0) {
      console.log('Aucune session à synchroniser');
      return;
    }

    console.log(`${sessions.length} sessions à traiter`);
    const processedSessions = new Set<string>();

    for (const session of sessions) {
      try {
        if (processedSessions.has(session.id)) {
          continue;
        }

        console.log(`Traitement session ${session.id}...`);
        await processSingleSession(session);
        processedSessions.add(session.id);
      } catch (error) {
        logger.error(`Erreur sur session ${session.id}:`, error);
      }
    }
  } finally {
    store.dispatch(setSyncing(false));
  }
}

async function processSingleSession(session: PendingDriveSession): Promise<void> {
  const updatedSession = { ...session };

  // recup le roadbookId d'abord
  let roadbookId: string;
  try {
    roadbookId = await sessionApi._ensureRoadbookId();
    console.log(`RoadbookId récupéré pour ${updatedSession.id}: ${roadbookId}`);
  } catch (error) {
    logger.error(` Erreur roadbookId pour ${updatedSession.id}:`, error);
    throw error; // Impossible de continuer sans le roadbookId
  }

  // recup les données météo si manquantes
  if (!updatedSession.weather && updatedSession.path.length > 0) {
    try {
      const lastPoint = updatedSession.path[updatedSession.path.length - 1];
      const weather = await getWeather(
        lastPoint.latitude,
        lastPoint.longitude,
        updatedSession.locationTimestamp,
        {
          timePrecisionHours: 1,
          distancePrecisionMeters: 1000,
        }
      );
      if (weather) {
        updatedSession.weather = weather;
        console.log(` Météo récupérée pour ${updatedSession.id}`);
      }
    } catch (error) {
      logger.error(` Erreur météo pour ${updatedSession.id}:`, error);
    }
  }

  // recup les infos de route si manquantes
  if (!updatedSession.roadInfo && updatedSession.path.length >= 2) {
    try {
      const roadInfo = await getGeoapifyRouteInfo(updatedSession.path, updatedSession.elapsedTime);
      if (roadInfo) {
        updatedSession.roadInfo = roadInfo;
        console.log(` RoadInfo récupéré pour ${updatedSession.id}`);
      }
    } catch (error) {
      logger.error(` Erreur roadInfo pour ${updatedSession.id}:`, error);
    }
  }

  // save whole session
  try {
    const sessionData = await mapDriveSessionToSessionData({
      elapsedTime: updatedSession.elapsedTime,
      userId: updatedSession.userId,
      userComment: updatedSession.userComment || '',
      path: updatedSession.path,
      offline: updatedSession.offline || false,
      weather: updatedSession.weather,
      roadInfo: updatedSession.roadInfo,
      vehicle: updatedSession.vehicle,
      roadbookId
    });

    // save dans la db
    const createdSession = await sessionApi.createSession(roadbookId, sessionData);

    // save dans firebase
    const firebaseData = {
      sessionId: createdSession.id,
      path: updatedSession.path,
      weather: updatedSession.weather,
      vehicle: updatedSession.vehicle,
      createdAt: Timestamp.fromMillis(updatedSession.createdAt),
      userId: updatedSession.userId
    };

    await addDoc(collection(db, 'driveSessionsGPS'), firebaseData);
    await removePendingDriveSession(updatedSession.id);
    store.dispatch(removePendingItem({ id: updatedSession.id, force: true }));

    const state = store.getState();
    state.sync.pendingItems.forEach((item) => {
      if (item.data.driveSessionId === updatedSession.id) {
        store.dispatch(
          removePendingItem({
            id: item.id,
            force: true,
          })
        );
      }
    });

    store.dispatch(clearSyncError(updatedSession.id));
    console.log(`Session ${updatedSession.id} et requêtes associées synchronisées et nettoyées`);

  } catch (error) {
    logger.error(` Erreur lors de la sauvegarde Firebase pour ${updatedSession.id}:`, error);
    // En cas d'erreur, remettre la session mise à jour en attente
    await savePendingDriveSession(updatedSession);

    store.dispatch(
      setSyncError({
        id: updatedSession.id,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      })
    );
    throw error;
  }
}