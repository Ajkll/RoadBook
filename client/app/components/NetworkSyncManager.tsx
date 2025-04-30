import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { AppState, AppStateStatus } from 'react-native';
import { selectIsInternetReachable } from '../store/slices/networkSlice';
import { selectPendingItems, selectIsSyncing } from '../store/slices/syncSlice';
import { completeSync } from '../services/sync/syncManager'; // Changé pour utiliser completeSync
import Toast from 'react-native-toast-message';
import { useNotifications } from './NotificationHandler';


const NetworkSyncManager: React.FC = () => {
  const isOnline = useSelector(selectIsInternetReachable);
  const pendingItems = useSelector(selectPendingItems);
  const isSyncing = useSelector(selectIsSyncing);
  const { showSucces } = useNotifications();

  useEffect(() => {
    if (isOnline && pendingItems.length > 0 && !isSyncing) {
      console.log('connexion retrouvée, lancement de la synchro');
      completeSync()
        .then(() => {
          showSucces('Synchronisation terminée', "Les données ont été correctement sauvegardées.", {
            position: 'bottom',
            duration: 3000,
          });
        })
        .catch((error) => {
          console.error('Erreur de synchronisation:', error);
        });
    }
  }, [isOnline, pendingItems.length, isSyncing]);


  // sync quand l'app revient au premier plan (app en bg to fg)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isOnline && pendingItems.length > 0 && !isSyncing) {
        console.log('app active en fg sync en cour');
        completeSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isOnline, pendingItems.length, isSyncing]);

  return null;
};

export default NetworkSyncManager;
