import React, { useMemo } from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme, ThemeColors } from '../../constants/theme';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import ProgressBar from '../../components/ui/ProgressBar';
import { useRoads } from '../../context/RoadContext';

const { width } = Dimensions.get('window');

export default function MyRoutes() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const router = useRouter();
  const currentPath = usePathname();
  
  // Récupération des données depuis le contexte
  const { roads } = useRoads();

  const handleSwipe = ({ nativeEvent }) => {
    if (nativeEvent.translationX < -50 && currentPath.includes('stats')) {
      router.push('/(tabs)/my-routes/my-roads');
    } else if (nativeEvent.translationX > 50 && currentPath.includes('my-roads')) {
      router.push('/(tabs)/my-routes/stats');
    }
  };

  // Calcul des totaux
  const totalStats = useMemo(() => {
    if (!Array.isArray(roads) || roads.length === 0) {
      return { totalDuration: 0, totalDistance: 0 };
    }

    const totalDuration = roads.reduce((sum, road) => sum + (road.duration || 0), 0);
    const totalDistance = roads.reduce((sum, road) => sum + (road.distance || 0), 0);

    return { totalDuration, totalDistance };
  }, [roads]);

  // Conversion des minutes en heures et minutes pour un affichage plus lisible
  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={handleSwipe}>
        <View style={styles.container}>
          <View style={styles.content}>
            <ProgressBar title="Progression" progress={67} />
          </View>

          <View style={styles.cardsContainer}>
            <View style={styles.roadCard}>
              <Text style={styles.text}>Heures totales</Text>
              <View style={styles.dataCard}>
                <Text style={styles.text}>
                  {formatDuration(totalStats.totalDuration)}
                </Text>
              </View>
            </View>

            <View style={styles.roadCard}>
              <Text style={styles.text}>Distance totale</Text>
              <View style={styles.dataCard}>
                <Text style={styles.text}>
                  {totalStats.totalDistance} km
                </Text>
              </View>
            </View>

          </View>
        </View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingTop: 20,
    },
    text: {
      fontSize: 16,
      color: colors.primaryText,
    },
    content: {
      width: width * 0.94,
    },
    cardsContainer: {
      width: width * 0.94,
      alignItems: 'center',
      paddingHorizontal: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    roadCard: {
      backgroundColor: colors.primary,
      width: '47%',
      height: 250,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
      marginTop: 20,
      paddingTop: 60,
      alignItems: 'center',
    },
    dataCard: {
      backgroundColor: colors.primaryDarker,
      height: 50,
      width: 90,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 40,

      // Ombre pour iOS
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 5,

      // Ombre pour Android
      elevation: 8,
    },
  });
