import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { useDispatch, useSelector } from 'react-redux';
import { tick, resetChrono } from '../store/slices/chronoSlice';
import {
  updateLocation,
  startTracking,
  stopTracking,
  resetLocation,
} from '../store/slices/locationSlice';
import { RootState } from '../store/store';
import { saveDriveSession } from '../services/firebase/driveSession';
import { getAuthData } from '../services/secureStorage';
import { getWeather } from '../services/api/weather';
import { selectIsInternetReachable } from '../store/slices/networkSlice';
import { getGeoapifyRouteInfo } from '../services/api/getRouteInfo';
import { useNotifications } from './NotificationHandler';

let isInstanceActive = false;
const instanceId = `chrono-${Math.random().toString(36).substr(2, 5)}`;

export default function ChronoWatcher() {
  const dispatch = useDispatch();
  const { showError, showWarning } = useNotifications();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isOnline = useSelector(selectIsInternetReachable);

  const isRunning = useSelector((state: RootState) => state.chrono.isRunning);
  const shouldSave = useSelector((state: RootState) => state.chrono.shouldSave);
  const elapsedTime = useSelector((state: RootState) => state.chrono.elapsedTime);
  const path = useSelector((state: RootState) => state.location.path);
  const vehicle = useSelector((state: RootState) => state.vehicle.type);

  const elapsedTimeRef = useRef(elapsedTime);
  const pathRef = useRef(path);
  const shouldSaveRef = useRef(shouldSave);
  const weatherRef = useRef<any>(null);
  const isTrackingActive = useRef(false);
  const isProcessing = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    console.log(`[${instanceId}] chrono monter`);

    if (isInstanceActive) {
      console.warn(`[${instanceId}] chrono dupliquer!`);
      return () => {
        console.log(`[${instanceId}] chrono dupliquer demonter`);
      };
    }

    // délai pour stabiliser l'initialisation
    const activationTimer = setTimeout(() => {
      isInstanceActive = true;
      console.log(`[${instanceId}] activation confirmée`);
    }, 300);

    return () => {
      clearTimeout(activationTimer);
      console.log(`[${instanceId}] chrono demonter`);

      // délais pour que l'instance se libére completement
      setTimeout(() => {
        isInstanceActive = false;
        isTrackingActive.current = false;
      }, 120);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    elapsedTimeRef.current = elapsedTime;
  }, [elapsedTime]);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    shouldSaveRef.current = shouldSave;
  }, [shouldSave]);

  // premier démarrage
  useEffect(() => {
    if (isRunning && isInitialLoad) {
      console.log(`[${instanceId}] premier démarrage détecté`);
      const stabilizationTimer = setTimeout(() => {
        setIsInitialLoad(false);
        console.log(`[${instanceId}] démarrage initial stabiliser`);
      }, 800);
      return () => clearTimeout(stabilizationTimer);
    }
  }, [isRunning, isInitialLoad]);

  // tracking and saving session
  useEffect(() => {
    let setupTimerRef: NodeJS.Timeout | null = null;

    console.log(`[${instanceId}] isrunning :`, isRunning, 'isInitialLoad:', isInitialLoad);

    const startTrackingFn = async () => {
      if (isProcessing.current || isTrackingActive.current) {
        console.log(`[${instanceId}] chrono en cours, skipping`);
        return;
      }
      isProcessing.current = true;
      try {
        console.log(`[${instanceId}] tracking demarrer`);
        isTrackingActive.current = true;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn(`[${instanceId}] Permission refusée`);
          isTrackingActive.current = false;
          return;
        }
        dispatch(startTracking());

        // démarrage du chronomètre si ce n'est pas déja fait
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            dispatch(tick());
          }, 1000);
          console.log(`[${instanceId}] chrono démarré`);
        }
        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          async (location) => {
            const { latitude, longitude } = location.coords;
            dispatch(updateLocation({ latitude, longitude }));

            // une seul demande a l'api (on pourrais tenire compt des changement métèo mais pas pour le moment)
            if (!weatherRef.current) {
              const weather = await getWeather(latitude, longitude);
              if (weather) {
                console.log(`[${instanceId}] meteo :`, weather);
                weatherRef.current = weather;
              } else {
                console.warn(`[${instanceId}] meteo indisponible`);
              }
            }
          }
        );
      } catch (error) {
        console.error(`[${instanceId}] erreur le tracking ne demarre pas:`, error);
        isTrackingActive.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } finally {
        isProcessing.current = false;
      }
    };

    const stopTrackingAndSave = async () => {
      if (isProcessing.current) {
        console.log(`[${instanceId}] deja en cour de gestion , skipping`);
        return;
      }
      isProcessing.current = true;
      try {
        console.log(`[${instanceId}] stop le tracking...`);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          console.log(`[${instanceId}] chrono arreté`);
        }
        if (locationSubscriptionRef.current) {
          console.log(`[${instanceId}] location subscription désactivé`);
          locationSubscriptionRef.current.remove();
          locationSubscriptionRef.current = null;
        }
        dispatch(stopTracking());
        isTrackingActive.current = false;
        if (isInitialLoad) {
          console.log(`[${instanceId}] premier chargement, pas de sauvegarde à effectuer`);
          return;
        }
        if (shouldSaveRef.current) {
          console.log(`[${instanceId}] sauvegarde en cours`);
          const auth = await getAuthData();
          const userId = auth?.user?.id || 'guestUser';

          const finalElapsedTime = elapsedTimeRef.current;
          const finalPath = pathRef.current;
          const weather = weatherRef.current;

          console.log(`[${instanceId}] User ID:`, userId);
          console.log(`[${instanceId}] Elapsedtime:`, finalElapsedTime);
          console.log(`[${instanceId}] Path.length:`, finalPath?.length || 0);
          console.log(`[${instanceId}] Weather:`, !!weather);
          console.log(`[${instanceId}] Véhicule:`, vehicle);

          if (finalElapsedTime === 0 || !finalPath || finalPath.length < 3) {
            console.log(`[${instanceId}] session ignorée : aucune donnée utile`);
            showError('⛔ Échec de la sauvegarde', "Ton trajet n'a pas été enregistré.", {
              position: 'center',
            });
          } else {
            // demande api en ligne
            let roadInfo = null;
            if (isOnline) {
              try {
                roadInfo = await getGeoapifyRouteInfo(finalPath, finalElapsedTime);
                console.log(`[${instanceId}] informations sur la route:`, roadInfo);
              } catch (error) {
                console.error(`[${instanceId}] récupération des infos routières echoué:`, error);
              }
            } else {
              console.log(
                `[${instanceId}] Pas de connexion internet, informations routières ignorées`
              );
            }

            // sauvegarde vers firebase
            try {
              console.log(`[${instanceId}] tentative de sauvegarde de la session`);
              await saveDriveSession({
                elapsedTime: finalElapsedTime,
                userId,
                path: finalPath,
                weather,
                roadInfo,
                vehicle,
              });

              console.log(`[${instanceId}] session sauvegardée `);
            } catch (error) {
              console.error(`[${instanceId}] echéc de la sauvegarde de session:`, error);
              showWarning(
                '⚠️ Problème de sauvegarde',
                "Une erreur s'est produite. Nouvelle tentative à la prochaine connexion.",
                { position: 'center' }
              );
            }
          }
        } else {
          console.log(`[${instanceId}] sauvegarde désactivée la session est ignorée.`);
        }
      } finally {
        console.log(`[${instanceId}] reset des states chrono et location`);
        dispatch(resetChrono());
        dispatch(resetLocation());
        isProcessing.current = false;
        weatherRef.current = null; // reset weather (l'api garde en cache anyway)
      }
    };

    const setupTracking = () => {
      if (isRunning && isInitialLoad) {
        console.log(`[${instanceId}] Stabilisation en attente`);
        return;
      }

      if (isRunning && !isTrackingActive.current) {
        console.log(`[${instanceId}] Démarrage normal du tracking`);
        setupTimerRef = setTimeout(() => {
          startTrackingFn();
        }, 300);
      } else if (!isRunning && isTrackingActive.current) {
        setupTimerRef = setTimeout(() => {
          stopTrackingAndSave();
        }, 300);
      }
    };

    setupTracking();

    return () => {
      if (setupTimerRef) {
        clearTimeout(setupTimerRef);
      }
    };
  }, [isRunning, isInitialLoad, isOnline, dispatch, vehicle]);

  return null;
}
