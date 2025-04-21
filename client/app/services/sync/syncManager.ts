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
  clearSyncError
} from '../../store/slices/syncSlice';
import { selectIsInternetReachable } from '../../store/slices/networkSlice';
import Toast from 'react-native-toast-message';
import { getGeoapifyRouteInfo } from '../api/getRouteInfo';
import { getWeather } from '../api/weather';

interface DriveSessionData {
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
}

interface PendingSessionPackage {
  session: PendingDriveSession;
  roadRequest?: PendingRoadInfoRequest;
  weatherRequest?: PendingWeatherRequest;
}

/**
 * Sauvegarde une session avec support hors ligne
 */
export async function saveSessionWithOfflineSupport(data: DriveSessionData): Promise<string> {
  const isOnline = selectIsInternetReachable(store.getState());
  const timestamp = Date.now();

  try {
    if (isOnline) {
      // Mode en ligne = sauvegarde directe
      return await saveOnlineSession(data);
    } else {
      // Mode hors ligne = sauvegarde storagelocale (asyncStorage)
      return await saveOfflineSession(data, timestamp);
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de session:', error);
    return await handleSaveError(data, timestamp);
  }
}

async function saveOnlineSession(data: DriveSessionData): Promise<string> {
  // Récupérer les infos manquantes si possible
  const [weather, roadInfo] = await Promise.all([
    data.weather ? data.weather : tryGetWeather(data.path),
    data.roadInfo ? data.roadInfo : tryGetRoadInfo(data.path, data.elapsedTime)
  ]);

  const docRef = await addDoc(collection(db, 'driveSessions'), {
    userId: data.userId,
    elapsedTime: data.elapsedTime,
    path: data.path,
    weather: weather || null,
    roadInfo: roadInfo || null,
    vehicle: data.vehicle || null,
    createdAt: Timestamp.now(),
  });

  console.log('En ligne - Session enregistrée avec ID:', docRef.id);
  return docRef.id;
}

async function saveOfflineSession(data: DriveSessionData, timestamp: number): Promise<string> {
  console.log('Hors ligne: stockage local de la session');
  const sessionPackage = await createPendingSessionPackage(data, timestamp);
  await saveSessionPackage(sessionPackage);

  Toast.show({
    type: 'info',
    text1: '📴 Mode hors ligne',
    text2: 'Trajet sauvegardé localement. Synchronisation automatique à la reconnexion.',
    position: 'bottom',
  });

  console.log('Session sauvegardée localement avec ID:', sessionPackage.session.id);
  return sessionPackage.session.id;
}

async function createPendingSessionPackage(data: DriveSessionData, timestamp: number): Promise<PendingSessionPackage> {
  const sessionId = `session_${timestamp}_${Math.random().toString(36).substr(2, 5)}`;

  const session: PendingDriveSession = {
    id: sessionId,
    elapsedTime: data.elapsedTime,
    userId: data.userId,
    path: data.path,
    weather: data.weather || null,
    roadInfo: data.roadInfo || null,
    vehicle: data.vehicle || null,
    createdAt: timestamp,
    locationTimestamp: timestamp,
  };

  const pkg: PendingSessionPackage = { session };

  if (data.path.length >= 2) { // pas d'info si le trajet est non significatif (normalement déja préalablement filtrer par ChronoWatcher mais double vérification)
    pkg.roadRequest = {
      id: `road_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      driveSessionId: sessionId,
      path: data.path,
      requestedAt: timestamp
    };
  }

  // meme réflexion que ci-dessus
  if (data.path.length > 0) {
    const lastPoint = data.path[data.path.length - 1];
    pkg.weatherRequest = {
      id: `weather_${timestamp}_${Math.random().toString(36).substr(2, 5)}`,
      driveSessionId: sessionId,
      latitude: lastPoint.latitude,
      longitude: lastPoint.longitude,
      timestamp,
      requestedAt: timestamp
    };
  }

  return pkg;
}

async function saveSessionPackage(pkg: PendingSessionPackage): Promise<void> {
  await savePendingDriveSession(pkg.session);

  if (pkg.roadRequest) {
    store.dispatch(addPendingItem({
      id: pkg.roadRequest.id,
      type: 'api',
      data: pkg.roadRequest
    }));
  }

  if (pkg.weatherRequest) {
    store.dispatch(addPendingItem({
      id: pkg.weatherRequest.id,
      type: 'api',
      data: pkg.weatherRequest
    }));
  }

  // Ajouter la session au store Redux
  store.dispatch(addPendingItem({
    id: pkg.session.id,
    type: 'trajet',
    data: pkg.session
  }));
}

async function handleSaveError(data: DriveSessionData, timestamp: number): Promise<string> {
  console.log('Tentative de sauvegarde de secours suite à une erreur');
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
    console.error('Erreur lors de la récupération des données météo de la sauvegard de secoure (fallback):', error);
    return null;
  }
}

async function tryGetRoadInfo(path: { latitude: number; longitude: number }[], elapsedTime: number) {
  if (path.length < 2) return null;

  try {
    return await getGeoapifyRouteInfo(path, elapsedTime);
  } catch (error) {
    console.error('Erreur lors de la récupération des infos de route :', error);
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

  console.log('synchronisation des sessions en attente');
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

        // Envoye à Firebase
        const docRef = await addDoc(collection(db, 'driveSessions'), {
          userId: session.userId,
          elapsedTime: session.elapsedTime,
          path: session.path,
          weather: session.weather || null,
          roadInfo: session.roadInfo || null,
          vehicle: session.vehicle || null,
          createdAt: Timestamp.fromMillis(session.createdAt),
        });

        await removePendingDriveSession(session.id);
        store.dispatch(removePendingItem(session.id));
        store.dispatch(clearSyncError(session.id));

        successCount++;
        console.log(`Session ${session.id} synchronisée avec succès (ID Firebase: ${docRef.id})`);
      } catch (error) {
        console.error(`Échec de synchronisation pour la session ${session.id}:`, error);
        store.dispatch(setSyncError({
          id: session.id,
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        }));
        failedCount++;
      }
    }

    if (successCount > 0) {
      await saveLastSyncDate();
      Toast.show({
        type: 'success',
        text1: '🔄 Synchronisation terminée',
        text2: `${successCount} trajet${successCount > 1 ? 's' : ''} synchronisé${successCount > 1 ? 's' : ''}`,
        position: 'bottom',
      });
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

// Nouvelle fonction principale de synchronisation
export async function completeSync(): Promise<void> {
  const isOnline = selectIsInternetReachable(store.getState());
  if (!isOnline) {
    return;
  }

  // Vérifier si une synchronisation est déjà en cours
  if (store.getState().sync.syncing) {
    return;
  }

  store.dispatch(setSyncing(true));
  console.log('synchronisation complète');

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
        console.error(`Erreur sur session ${session.id}:`, error);
      }
    }
  } finally {
    store.dispatch(setSyncing(false));
  }
}

async function processSingleSession(session: PendingDriveSession): Promise<void> {
  let updatedSession = { ...session };

  if (!updatedSession.weather && updatedSession.path.length > 0) {
    try {
      const lastPoint = updatedSession.path[updatedSession.path.length - 1];
      const weather = await getWeather(
        lastPoint.latitude,
        lastPoint.longitude,
        updatedSession.locationTimestamp, // Utiliser le timestamp ei : pour les requete api "hystorique"
        {
          timePrecisionHours: 1,
          distancePrecisionMeters: 1000
        }
      );
      if (weather) {
        updatedSession.weather = weather;
        console.log(`Météo récupérée pour ${updatedSession.id}`);
      }
    } catch (error) {
      console.error(`Erreur météo pour ${updatedSession.id}:`, error);
    }
  }

  if (!updatedSession.roadInfo && updatedSession.path.length >= 2) {
    try {
      const roadInfo = await getGeoapifyRouteInfo(updatedSession.path, updatedSession.elapsedTime);
      if (roadInfo) {
        updatedSession.roadInfo = roadInfo;
        console.log(`RoadInfo récupéré pour ${updatedSession.id}`);
      }
    } catch (error) {
      console.error(`Erreur roadInfo pour ${updatedSession.id}:`, error);
    }
  }

  if (updatedSession.weather || updatedSession.roadInfo) {
    try {
      // Sauvegarde dans Firebase et suppression du localStorage et redux
      await saveSessionToFirebase(updatedSession);
      await removePendingDriveSession(updatedSession.id);
      store.dispatch(removePendingItem({
        id: updatedSession.id,
        force: true
      }));

      // Suppression des requêtes API associées a une session de conduite
      const state = store.getState();
      state.sync.pendingItems.forEach(item => {
        if (item.data.driveSessionId === updatedSession.id) {
          store.dispatch(removePendingItem({
            id: item.id,
            force: true
          }));
        }
      });

      console.log(`Session ${updatedSession.id} et requêtes associées synchronisées et nettoyées`);

    } catch (error) {
      console.error(`Erreur lors de la sauvegarde Firebase pour ${updatedSession.id}:`, error);
      await savePendingDriveSession(updatedSession);

      store.dispatch(setSyncError({
        id: updatedSession.id,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }));
    }
  } else {
    console.log(`Session ${updatedSession.id} ignorée - aucune donnée API disponible`);
  }
}

async function saveSessionToFirebase(session: PendingDriveSession): Promise<void> {
  await addDoc(collection(db, 'driveSessions'), {
    userId: session.userId,
    elapsedTime: session.elapsedTime,
    path: session.path,
    weather: session.weather || null,
    roadInfo: session.roadInfo || null,
    vehicle: session.vehicle || null,
    createdAt: Timestamp.fromMillis(session.createdAt),
  });
}


// to do : ajoute de possibiliter de enregistrer des trajet "mes trajet " et d'attendre la connection pour les sync