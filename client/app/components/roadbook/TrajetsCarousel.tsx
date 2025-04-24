import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import MapView, { Polyline, Marker } from 'react-native-maps';
import {
  getStartEndInfo,
  getLastDriveSessions,
  getGpsPoints,
  getWeatherInfo,
  formatElapsedTime,
} from '../../utils/firebase/driveSessionUtils';
import TrajetOptionsModal from '../modals/TrajetOptionsModal';
import icon_arriver from '../../assets/icones/routier/point-d-arrive-small.png';
import icon_depart from '../../assets/icones/routier/point-de-depart-small.png';
import { useTheme } from '../../constants/theme';

interface Point {
  latitude: number;
  longitude: number;
}

interface RoadInfo {
  summary: {
    totalDistanceKm: number;
    totalDurationMinutes: number;
    trafficDelayMinutes: number;
  };
  speed: {
    average: number;
  };
}

interface WeatherDetails {
  temperature?: number;
  conditions: string;
  windSpeed?: number;
  visibility?: number;
  humidity?: number;
  pressure?: number;
}

interface Trajet {
  id: string;
  path: Point[];
  createdAt: any;
  vehicle?: string;
  weather?: string | WeatherDetails;
  elapsedTime?: number;
  nom?: string;
  roadInfo?: RoadInfo;
}

interface TrajetsCarouselProps {
  trajets?: Trajet[];
  onScrollIndexChange?: (index: number) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_HEIGHT = 330;
const ITEM_SPACING = 25;
const ITEM_FULL_HEIGHT = CARD_HEIGHT + ITEM_SPACING * -1;

const getRegionForCoordinates = (points: Point[]) => {
  if (!points || points.length === 0) {
    return {
      latitude: 50.6657,
      longitude: 4.5868,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  points.forEach((point) => {
    minLat = Math.min(minLat, point.latitude);
    maxLat = Math.max(maxLat, point.latitude);
    minLng = Math.min(minLng, point.longitude);
    maxLng = Math.max(maxLng, point.longitude);
  });

  const latitude = (minLat + maxLat) / 2;
  const longitude = (minLng + maxLng) / 2;

  let latitudeDelta = (maxLat - minLat) * 1.3;
  let longitudeDelta = (maxLng - minLng) * 1.3;

  latitudeDelta = Math.max(latitudeDelta, 0.005);
  longitudeDelta = Math.max(longitudeDelta, 0.005);

  return {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta,
  };
};

const formatWeather = (weather: any): string | WeatherDetails => {
  if (!weather) return 'Non disponible';

  if (typeof weather === 'string') return weather;

  return {
    conditions: weather.conditions || weather.weather?.conditions || 'Inconnu',
    temperature: weather.temperature,
    windSpeed: weather.windSpeed,
    visibility: weather.visibility,
    humidity: weather.humidity,
    pressure: weather.pressure,
  };
};

const TrajetsCarousel: React.FC<TrajetsCarouselProps> = ({
  trajets: propsTrajets,
  onScrollIndexChange,
}) => {
  const theme = useTheme();
  const [trajets, setTrajets] = useState<Trajet[]>([]);
  const [selectedTrajet, setSelectedTrajet] = useState<Trajet | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const pullRatio = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const sessions = await getLastDriveSessions(5);
      const gpsList = await getGpsPoints(5);
      const startEndList = await getStartEndInfo(5);
      const weatherList = await getWeatherInfo(5);

      const combined: Trajet[] = sessions.map((session, index) => {
        const weatherData = weatherList[index];
        const weatherText = formatWeather(weatherData);

        return {
          id: `trajet-${index}`,
          path: Array.isArray(gpsList[index]?.path) ? gpsList[index].path : [],
          createdAt: session.createdAt,
          vehicle: session.vehicle ?? 'Inconnu',
          weather: weatherText,
          elapsedTime: session.elapsedTime ?? 0,
          nom: session.nom ?? `Trajet ${index + 1}`,
          roadInfo: session.roadInfo,
        };
      });

      setTrajets(combined);
    } catch (err) {
      console.error('Erreur lors du chargement des trajets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    if (propsTrajets && propsTrajets.length > 0) {
      const formattedTrajets = propsTrajets.map((trajet) => ({
        ...trajet,
        weather: formatWeather(trajet.weather),
      }));

      setTrajets(formattedTrajets);
      setLoading(false);
      return;
    }

    loadData();
  }, [propsTrajets, loadData]);

  useEffect(() => {
    const indexListener = scrollY.addListener(({ value }) => {
      const index = Math.round(value / ITEM_FULL_HEIGHT);
      if (index !== currentIndex && index >= 0 && index < trajets.length) {
        setCurrentIndex(index);
        if (onScrollIndexChange) {
          onScrollIndexChange(index);
        }
      }

      if (value < 0) {
        pullRatio.setValue(Math.min(Math.abs(value) / 100, 1));
      } else {
        pullRatio.setValue(0);
      }
    });

    return () => {
      scrollY.removeListener(indexListener);
    };
  }, [scrollY, trajets.length, currentIndex, onScrollIndexChange, pullRatio]);

  const arrowRotation = pullRatio.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
    extrapolate: 'clamp',
  });

  const arrowOpacity = pullRatio.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.background,
      borderRadius: 16,
      marginHorizontal: 2,
      height: CARD_HEIGHT,
      shadowColor: theme.colors.border,
      shadowOpacity: 0.25,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
      overflow: 'hidden',
      position: 'relative',
      marginBottom: ITEM_SPACING * -1,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
    map: {
      height: 220,
      width: '100%',
    },
    menuButton: {
      position: 'absolute',
      zIndex: 10,
      top: 12,
      right: 12,
      backgroundColor: theme.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    menuText: {
      color: theme.colors.primaryText,
      fontSize: 18,
    },
    info: {
      padding: 14,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      color: theme.colors.backgroundText,
    },
    boldSubtitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.colors.backgroundTextSoft,
      marginBottom: 4,
    },
    refreshIndicator: {
      position: 'absolute',
      top: 50,
      alignSelf: 'center',
      zIndex: 10,
      backgroundColor: theme.colors.background,
      width: 50,
      height: 50,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.colors.border,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.6,
      shadowRadius: 3,
      elevation: 5,
    },
    refreshArrow: {
      fontSize: 30,
      color: theme.colors.primary,
    },
  });

  return (
    <>
      <Animated.View
        style={[
          styles.refreshIndicator,
          {
            opacity: arrowOpacity,
            transform: [{ rotate: arrowRotation }],
          },
        ]}
      >
        <Text style={styles.refreshArrow}>↓</Text>
      </Animated.View>

      <Animated.FlatList
        ref={flatListRef}
        data={trajets}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="fast"
        snapToInterval={ITEM_FULL_HEIGHT}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={70}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{ paddingVertical: 100 }}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * ITEM_FULL_HEIGHT,
            index * ITEM_FULL_HEIGHT,
            (index + 1) * ITEM_FULL_HEIGHT,
          ];

          const scale = scrollY.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          });

          const translateY = scrollY.interpolate({
            inputRange,
            outputRange: [20, 0, 20],
            extrapolate: 'clamp',
          });

          const region = item.path.length > 1 ? getRegionForCoordinates(item.path) : undefined;
          const weatherText =
            typeof item.weather === 'string' ? item.weather : item.weather?.conditions;

          return (
            <Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }]}>
              <TouchableOpacity style={styles.menuButton} onPress={() => setSelectedTrajet(item)}>
                <Text style={styles.menuText}>≡</Text>
              </TouchableOpacity>

              <MapView style={styles.map} region={region} scrollEnabled={false} zoomEnabled={false}>
                <Polyline
                  coordinates={item.path.filter(
                    (p) => p && typeof p.latitude === 'number' && typeof p.longitude === 'number'
                  )}
                  strokeColor={theme.ui?.map?.polyline?.default || theme.colors.primary}
                  strokeWidth={10}
                  lineCap="round"
                  lineJoin="round"
                  lineDashPattern={[1, 0]}
                  zIndex={2}
                />
                {item.path[0] && (
                  <Marker
                    coordinate={item.path[0]}
                    title="Départ"
                    image={icon_depart}
                    anchor={{ x: 0.5, y: 0.6 }}
                  />
                )}
                {item.path[item.path.length - 1] && (
                  <Marker
                    coordinate={item.path[item.path.length - 1]}
                    title="Arrivée"
                    image={icon_arriver}
                    anchor={{ x: 0.5, y: 0.6 }}
                  />
                )}
              </MapView>

              <View style={styles.info}>
                <Text style={styles.title}>{item.nom}</Text>
                <Text style={styles.boldSubtitle}>Météo: {weatherText}</Text>
                <Text style={styles.boldSubtitle}>
                  Durée: {formatElapsedTime(item.elapsedTime || 0)}
                </Text>
              </View>
            </Animated.View>
          );
        }}
      />

      <TrajetOptionsModal
        trajet={selectedTrajet}
        visible={selectedTrajet !== null}
        onClose={() => setSelectedTrajet(null)}
      />
    </>
  );
};

export default TrajetsCarousel;

// to do : optimiser l'aspect visuel en ajoutant une animation polyline
