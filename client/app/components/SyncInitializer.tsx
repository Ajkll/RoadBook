import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addPendingItem, selectPendingItems } from '../store/slices/syncSlice';
import {
  getPendingDriveSessions,
  getPendingWeatherRequests,
  getPendingRoadInfoRequests,
} from '../utils/storageUtils';

const SyncInitializer = () => {
  const dispatch = useDispatch();
  const existingItems = useSelector(selectPendingItems);

  useEffect(() => {
    const initSyncState = async () => {
      try {
        console.log('initialiser sync');

        // anti doublon
        const existingIds = new Set(existingItems.map((item) => item.id));
        console.log(` ${existingIds.size} éléments déjà dans le store Redux`);

        const pendingSessions = await getPendingDriveSessions();
        console.log(`${pendingSessions.length} sessions en attente dans AsyncStorage`);

        // Ajouter les nouvelles sessions
        let newSessionsCount = 0;
        pendingSessions.forEach((session) => {
          if (!existingIds.has(session.id)) {
            dispatch(
              addPendingItem({
                id: session.id,
                type: 'trajet',
                data: session,
              })
            );
            existingIds.add(session.id);
            newSessionsCount++;
          } else {
            console.log('la session était bien initialiser dans le store redux !');
          }
        });
        console.log(`donc ${newSessionsCount} nouvelles sessions ajoutées au store redux`);

        // Même chose pour les requetes météo (desuet car plus de requet météo sans session) mais on garde en fallback
        const pendingWeatherRequests = await getPendingWeatherRequests();

        let newWeatherCount = 0;
        pendingWeatherRequests.forEach((request) => {
          if (!existingIds.has(request.id)) {
            dispatch(
              addPendingItem({
                id: request.id,
                type: 'weather',
                data: request,
              })
            );
            existingIds.add(request.id);
            newWeatherCount++;
          }
        });

        // pareille pour les infos de la route (desuet aussi)
        const pendingRoadInfoRequests = await getPendingRoadInfoRequests();
        let newRoadInfoCount = 0;
        pendingRoadInfoRequests.forEach((request) => {
          if (!existingIds.has(request.id)) {
            dispatch(
              addPendingItem({
                id: request.id,
                type: 'roadInfo',
                data: request,
              })
            );
            existingIds.add(request.id);
            newRoadInfoCount++;
          }
        });
      } catch (error) {
        console.error('erreur de sync api route:', error);
      }
    };

    initSyncState();
  }, [dispatch, existingItems]);

  return null;
};

export default SyncInitializer;
