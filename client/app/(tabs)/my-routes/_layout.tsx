import React, { useMemo, useCallback, useState, useRef } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { sessionApi } from '../../services/api';
import { RoadProvider } from '../../context/RoadContext'; 
import { SessionData } from '../../types/session.types';
import { useFocusEffect } from '@react-navigation/native';

export default function MyRoutesLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const styles = useMemo(() => createStyles(), [colors]);

  const isStatsActive = pathname.includes('stats');
  const isMyRoadsActive = pathname.includes('my-roads');

  const [roads, setRoads] = useState<SessionData[]>([]);
  
  // Référence pour contrôler l'arrêt des retry
  const retryControllerRef = useRef<{ shouldStop: boolean }>({ shouldStop: false });
  
  async function safeRetry<T>(
    fn: () => Promise<T>, 
    maxRetries = 10, 
    delay = 2000,
    controller: { shouldStop: boolean }
  ): Promise<T | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Vérifier si on doit arrêter les tentatives
      if (controller.shouldStop) {
        console.log('Retry interrompu - utilisateur a quitté la page');
        return null;
      }

      try {
        const result = await fn();
        return result;
      } catch (error: any) {
        // Log détaillé de l'erreur sans la relancer
        const errorMessage = error?.message || error?.toString() || 'Erreur inconnue';
        const errorCode = error?.code || error?.status || 'N/A';
        
        console.warn(`Tentative ${attempt + 1}/${maxRetries} échouée:`, {
          message: errorMessage,
          code: errorCode,
          stack: error?.stack ? error.stack.split('\n').slice(0, 3).join('\n') : 'Pas de stack trace'
        });

        // Ne pas attendre sur la dernière tentative
        if (attempt < maxRetries - 1) {
          // Vérifier encore une fois avant d'attendre
          if (controller.shouldStop) {
            console.log('Retry interrompu pendant le délai d\'attente');
            return null;
          }
          await new Promise((res) => setTimeout(res, delay));
        }
      }
    }

    console.error(`Toutes les ${maxRetries} tentatives ont échoué pour récupérer les sessions`);
    return null;
  }

  // Fonction pour récupérer les sessions
  const fetchRoadbooks = useCallback(async () => {
    try {
      const sessions = await safeRetry(
        () => sessionApi.getUserSessions(),
        10,
        2000,
        retryControllerRef.current
      );

      if (!sessions) {
        console.warn('Impossible de récupérer les sessions après plusieurs tentatives.');
        return;
      }

      // Vérifier si on doit encore traiter les données
      if (retryControllerRef.current.shouldStop) {
        console.log('Traitement des données interrompu');
        return;
      }

      const data = sessions.map((session) => ({
        id: session.id,
        title: session.notes,
        date: session.date,
        distance: session.distance,
        duration: session.duration,
        startLocation: session.startLocation,
        endLocation: session.endLocation,
        weather: session.weather,
        startTime: session.startTime,
        roadbookId: session.roadbookId,
      }));

      console.log('Sessions récupérées avec succès:', data.length, 'sessions');
      setRoads(data);
    } catch (error: any) {
      // Catch final au cas où une erreur passerait à travers
      console.error('Erreur non gérée dans fetchRoadbooks:', {
        message: error?.message || 'Erreur inconnue',
        code: error?.code || error?.status || 'N/A'
      });
    }
  }, []);

  // Fonction refresh exposée au contexte
  const refreshRoads = useCallback(() => {
    console.log('Refresh des sessions demandé');
    // Réinitialiser le contrôleur pour permettre les nouvelles tentatives
    retryControllerRef.current.shouldStop = false;
    fetchRoadbooks();
  }, [fetchRoadbooks]);

  // Récupérer les sessions au focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        if (isActive) {
          // Réinitialiser le contrôleur au focus
          retryControllerRef.current.shouldStop = false;
          await fetchRoadbooks();
        }
      };

      loadData();

      return () => {
        isActive = false;
        // Arrêter tous les retry en cours quand on quitte
        retryControllerRef.current.shouldStop = true;
        console.log('Page quittée - arrêt des retry en cours');
      };
    }, [fetchRoadbooks])
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Stack Navigation avec animation */}
      <RoadProvider roads={roads} refreshRoads={refreshRoads}>
        <Stack>
          <Stack.Screen name="stats" options={{ headerShown: false, animation: 'slide_from_left' }} />
          <Stack.Screen
            name="my-roads"
            options={{ headerShown: false, animation: 'slide_from_right' }}
          />
        </Stack>
      </RoadProvider>

      {/* Navigation persistante en bas */}
      <View style={styles.navigation}>
        <TouchableOpacity onPress={() => router.push('/(tabs)/my-routes/stats')}>
          <FontAwesome
            name={isStatsActive ? 'circle' : 'circle-o'}
            size={isStatsActive ? 20 : 15}
            color={colors.backgroundIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(tabs)/my-routes/my-roads')}>
          <FontAwesome
            name={isMyRoadsActive ? 'circle' : 'circle-o'}
            size={isStatsActive ? 15 : 20}
            color={colors.backgroundIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    navigation: {
      position: 'absolute',
      bottom: 90,
      width: '8%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignSelf: 'center',
    },
  });