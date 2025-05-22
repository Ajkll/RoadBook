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
  

  // Recuperer les sessions 
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchRoadbooks = async () => {
        try {
          const sessions = await sessionApi.getUserSessions();

          if (!isActive) return;

          const data = sessions.map((session) => ({
            id: session.id,
            title: session.startLocation,
            date: new Date(session.date),
            distance: session.distance,
            duration: session.duration,
            weather: session.weather,
          }));

          console.log(data);
          setRoads(data);
        } catch (error) {
          console.error('Erreur lors du chargement des sessions :', error);
        }
      };

      fetchRoadbooks();

      return () => {
        isActive = false;
      };
    }, [])
  );


  return (
    <View style={{ flex: 1 }}>
      {/* Stack Navigation avec animation */}
      <RoadProvider roads={roads}>
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
