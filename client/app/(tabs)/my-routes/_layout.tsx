import React, { useMemo, useCallback, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { sessionApi } from '../../services/api';
import { RoadProvider } from '../../context/RoadContext'; 
import { RoadTypes } from '../../types/session.types';
import { useFocusEffect } from '@react-navigation/native';

export default function MyRoutesLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const styles = useMemo(() => createStyles(), [colors]);

  const isStatsActive = pathname.includes('stats');
  const isMyRoadsActive = pathname.includes('my-roads');

  const [roads, setRoads] = useState<RoadTypes[]>([]);
  
async function safeRetry<T>(fn: () => Promise<T>, maxRetries = 10, delay = 2000): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      // Ne pas relancer l'erreur, juste log ou ignorer
      console.warn(`Tentative ${attempt + 1} échouée: ${error?.message || error}`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  console.warn('Toutes les tentatives ont échoué.');
  return null;
}


// Fonction pour récupérer les sessions
const fetchRoadbooks = useCallback(async () => {
  const sessions = await safeRetry(() => sessionApi.getUserSessions());

  if (!sessions) {
    console.warn('Impossible de récupérer les sessions après plusieurs tentatives.');
    return;
  }

  //console.log("Session brut: ", sessions)

  const data = sessions.map((session) => ({
    id: session.id,
    title: session.notes,
    date: new Date(session.date),
    distance: session.distance,
    duration: session.duration,
    startLocation: session.startLocation,
    endLocation: session.endLocation,
    weather: session.weather,
  }));

  console.log('Sessions récupérées:', data);
  setRoads(data);
}, []);

// Fonction refresh exposée au contexte
const refreshRoads = useCallback(() => {
  console.log('Refresh des sessions demandé');
  fetchRoadbooks();
}, [fetchRoadbooks]);

// Récupérer les sessions au focus
useFocusEffect(
  useCallback(() => {
    let isActive = true;

    const loadData = async () => {
      if (isActive) {
        await fetchRoadbooks();
      }
    };

    loadData();

    return () => {
      isActive = false;
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
            color={colors.primaryIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(tabs)/my-routes/my-roads')}>
          <FontAwesome
            name={isMyRoadsActive ? 'circle' : 'circle-o'}
            size={isStatsActive ? 15 : 20}
            color={colors.primaryIcon}
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