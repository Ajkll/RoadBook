import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
  AnimatedRegion,
  MarkerAnimated,
} from 'react-native-maps';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { Image, Animated } from 'react-native';
import voiture from '../assets/icones/routier/voiture.png';
import moto from '../assets/icones/routier/moto-icone.png';
import camion from '../assets/icones/routier/camion-icone.png';
import camionette from '../assets/icones/routier/camionette-icone.png';
import visualIcon from '../assets/icones/routier/visualisation-icone.jpg';
import centerIcon from '../assets/icones/routier/recentrer.png';
import { setVehicleType } from '../store/slices/vehicleSlice';
import waitingIcone from '../assets/images/waiting-page.png';
import { useTheme } from '../constants/theme';
import StartButtonModal from '../components/modals/StartButtonModal';
import * as Location from 'expo-location';
import { startTracking, setMapReady } from '../store/slices/locationSlice';
import { startChrono } from '../store/slices/chronoSlice';
import { useSound } from '../hooks/useSound';
import ActionSheet from 'react-native-actions-sheet';

const { width, height } = Dimensions.get('window');
const AUTO_FOLLOW_DELAY = 5000; // Timer de suivit du véhicule
const INACTIVITY_TIMEOUT = 3200; // Timer de suivit d'inactivité

export default function StartDriveScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { latitude, longitude, path, tracking, tempBuffer } = useSelector(
    (state: RootState) => state.location
  );
  const mapRef = useRef(null);
  const dispatch = useDispatch();
  const elapsedTime = useSelector((state: RootState) => state.chrono.elapsedTime);
  const isRunning = useSelector((state: RootState) => state.chrono.isRunning);
  const [hasReceivedPosition, setHasReceivedPosition] = useState(false);
  const [lastValidPosition, setLastValidPosition] = useState({ latitude: null, longitude: null });
  const [mapReady, setMapReady] = useState(false);
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const regionRef = useRef({
    latitude: latitude || 0,
    longitude: longitude || 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const { play } = useSound();
  const [mapType, setMapType] = useState('standard');
  const [polylineColor, setPolylineColor] = useState(theme.colors.ui.map.polyline.default);
  const [customizationVisible, setCustomizationVisible] = useState(false);
  const [selectedVehicleIcon, setSelectedVehicleIcon] = useState(voiture);

  const [userControllingMap, setUserControllingMap] = useState(false);
  const lastPositionRef = useRef({ latitude, longitude });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastUpdateTimeRef = useRef(0);
  const UPDATE_INTERVAL_MS = 500;

  const autoFollowTimerRef = useRef(null);
  const lastInteractionTimeRef = useRef(Date.now());

  const animatedCoord = useMemo(
    () =>
      new AnimatedRegion({
        latitude: latitude || 0,
        longitude: longitude || 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }),
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [initialPosition, setInitialPosition] = useState(null);

  useEffect(() => {
    if (tracking) {
      actionSheetRef.current?.hide();
    }
  }, [tracking]);

  // Récupération de la position initiale
  useEffect(() => {
    const getInitialPosition = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setInitialPosition({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        setHasReceivedPosition(true);
        setIsLoading(false);
      } catch (error) {
        console.log('Error getting location', error);
        setIsLoading(false);
      }
    };

    getInitialPosition();
  }, []);

  const handleStartTracking = useCallback(() => {
    setTimeout(() => {
      dispatch(startTracking());
      dispatch(startChrono());

      setTimeout(() => {
        if (actionSheetRef.current) {
          actionSheetRef.current.hide(); // Correction ici
        }
      }, 50);
    }, 100);
  }, [dispatch]);

  // detecter les bord en fonction de notre position
  const isPositionNearEdge = useCallback(() => {
    if (!mapRef.current || !latitude || !longitude || userControllingMap) {
      return false;
    }
    const region = regionRef.current;
    const edgeThreshold = 0.15; // 15% du bord

    // Calculer les limites de la carte
    const latPadding = region.latitudeDelta * edgeThreshold;
    const lngPadding = region.longitudeDelta * edgeThreshold;

    const northBound = region.latitude + region.latitudeDelta / 2 - latPadding;
    const southBound = region.latitude - region.latitudeDelta / 2 + latPadding;
    const eastBound = region.longitude + region.longitudeDelta / 2 - lngPadding;
    const westBound = region.longitude - region.longitudeDelta / 2 + lngPadding;

    return (
      latitude > northBound ||
      latitude < southBound ||
      longitude > eastBound ||
      longitude < westBound
    );
  }, [latitude, longitude, userControllingMap]);

  // reset du timer si l'user a pas interagit
  const resetAutoFollowTimer = useCallback(() => {
    if (autoFollowTimerRef.current) {
      clearTimeout(autoFollowTimerRef.current);
    }

    lastInteractionTimeRef.current = Date.now();

    autoFollowTimerRef.current = setTimeout(() => {
      if (userControllingMap && Date.now() - lastInteractionTimeRef.current >= AUTO_FOLLOW_DELAY) {
        setUserControllingMap(false);
        console.log('remises en mode automatique');
      }
    }, AUTO_FOLLOW_DELAY);
  }, [userControllingMap]);

  const updateRegion = useCallback(
    (lat, long) => {
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < UPDATE_INTERVAL_MS || userControllingMap) {
        return;
      }

      lastUpdateTimeRef.current = now;
      lastPositionRef.current = { latitude: lat, longitude: long };

      const newRegion = {
        latitude: lat,
        longitude: long,
        latitudeDelta: regionRef.current.latitudeDelta, // Garde le delta actuel
        longitudeDelta: regionRef.current.longitudeDelta,
      };

      regionRef.current = newRegion;
      mapRef.current?.animateToRegion(newRegion, 500);
    },
    [userControllingMap]
  );

  useEffect(() => {
    if (latitude && longitude) {
      setHasReceivedPosition(true);
      setLastValidPosition({ latitude, longitude });

      updateRegion(latitude, longitude);
      animatedCoord
        .timing({
          latitude,
          longitude,
          duration: 500,
          useNativeDriver: false,
        })
        .start();
    }
  }, [latitude, longitude, updateRegion, animatedCoord]);

  // mode de customisation visuel
  useEffect(() => {
    if (customizationVisible) {
      Animated.timing(fadeAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [customizationVisible, fadeAnim]);

  useEffect(() => {
    resetAutoFollowTimer();

    return () => {
      if (autoFollowTimerRef.current) {
        clearTimeout(autoFollowTimerRef.current);
      }
    };
  }, [resetAutoFollowTimer]);

  const handleZoom = useCallback(
    (zoomIn) => {
      if (!mapRef.current) return;
      lastInteractionTimeRef.current = Date.now();
      const currentRegion = regionRef.current;
      const zoomFactor = zoomIn ? 0.5 : 2;

      // Limites plus strictes pour le zoom
      const minDelta = 0.0005;
      const maxDelta = 0.5;

      let newDelta = currentRegion.latitudeDelta * zoomFactor;
      newDelta = Math.max(minDelta, Math.min(newDelta, maxDelta));

      const newRegion = {
        ...currentRegion,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      };

      regionRef.current = newRegion;
      mapRef.current.animateToRegion(newRegion, 350);
      setUserControllingMap(true);
      resetAutoFollowTimer();
    },
    [resetAutoFollowTimer]
  );

  const changePolylineColor = useCallback((color) => {
    setPolylineColor(color);
  }, []);

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const changeMapType = useCallback((type) => {
    setMapType(type);
  }, []);

  // fonction pour le recentrage manuelle
  const recenterMap = useCallback(() => {
    setUserControllingMap(false);
    lastInteractionTimeRef.current = Date.now();
    if (latitude && longitude) {
      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: regionRef.current.latitudeDelta,
          longitudeDelta: regionRef.current.longitudeDelta,
        },
        500
      );
    }
  }, [latitude, longitude]);

  const handleMapDragStart = useCallback(() => {
    // si l'user à manipuler la carte
    setUserControllingMap(true);
    lastInteractionTimeRef.current = Date.now();
    resetAutoFollowTimer();
  }, [resetAutoFollowTimer]);

  const getDisplayCoordinates = useCallback((coords: Coord[]) => {
    if (coords.length < 100) return coords;
    return coords.filter((_, index) => index % 2 === 0);
  }, []);

  const polylineComponent = useMemo(() => {
    const coordinates = tracking ? [...path, ...getDisplayCoordinates(tempBuffer)] : path;
    if (coordinates.length > 1) {
      return <Polyline coordinates={coordinates} strokeColor={polylineColor} strokeWidth={13} />;
    }
    return null;
  }, [path, tempBuffer, tracking, polylineColor, getDisplayCoordinates]);

  const markerComponent = useMemo(() => {
    if (latitude && longitude) {
      return (
        <MarkerAnimated
          coordinate={animatedCoord}
          anchor={{ x: 0.7, y: 0.5 }} // Valeurs par défaut pour le centrage
        >
          <Image
            source={selectedVehicleIcon}
            style={{ width: 40, height: 40, resizeMode: 'contain' }}
          />
        </MarkerAnimated>
      );
    }
    return null;
  }, [latitude, longitude, animatedCoord, selectedVehicleIcon]);

  useEffect(() => {
    if (!tracking && !isRunning && !customizationVisible) {
      const inactivityTimer = setTimeout(() => {
        if (Date.now() - lastInteractionTimeRef.current >= INACTIVITY_TIMEOUT) {
          actionSheetRef.current?.show();
        }
      }, INACTIVITY_TIMEOUT);

      return () => clearTimeout(inactivityTimer);
    }
  }, [tracking, isRunning, customizationVisible]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={waitingIcone} style={styles.loadingImage} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation={false}
        showsMyLocationButton={false}
        initialRegion={
          initialPosition
            ? {
                latitude: initialPosition.latitude,
                longitude: initialPosition.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : undefined
        }
        mapType={mapType}
        moveOnMarkerPress={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={() => {
          setMapReady(true);
          actionSheetRef.current?.show();
          dispatch({ type: 'location/setMapReady', payload: true });
          play('GPS_READY');
        }}
        onPanDrag={handleMapDragStart}
        onTouchStart={handleMapDragStart}
        onRegionChangeComplete={(region) => {
          const minDelta = 0.0005;
          const maxDelta = 0.5;
          const newRegion = {
            latitude: region.latitude,
            longitude: region.longitude,
            latitudeDelta: Math.max(minDelta, Math.min(region.latitudeDelta, maxDelta)),
            longitudeDelta: Math.max(minDelta, Math.min(region.longitudeDelta, maxDelta)),
          };
          regionRef.current = newRegion;
          resetAutoFollowTimer();
        }}
        zoomEnabled={false}
        zoomControlEnabled={false}
      >
        {polylineComponent}
        {markerComponent}
      </MapView>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
      </View>

      <TouchableOpacity
        style={styles.visualButton}
        onPress={() => {
          lastInteractionTimeRef.current = Date.now();
          setCustomizationVisible(true);
        }}
      >
        <Image source={visualIcon} style={styles.visualIcon} />
      </TouchableOpacity>

      {userControllingMap && tracking && (
        <TouchableOpacity style={styles.recenterButton} onPress={recenterMap}>
          <Image source={centerIcon} style={styles.centerIcon} />
        </TouchableOpacity>
      )}

      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom(true)}>
          <Text style={styles.icon}>➕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={() => handleZoom(false)}>
          <Text style={styles.icon}>➖</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={customizationVisible} transparent animationType="fade">
        <View style={styles.modalWrapper}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
          <View style={styles.modalPanel}>
            <Text style={styles.modalTitle}>Personnalisation</Text>
            <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
              <View style={styles.section}>
                <Text style={styles.optionLabel}>Type de carte</Text>
                {['standard', 'satellite', 'hybrid'].map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => changeMapType(type)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      pressed && styles.optionButtonPressed,
                    ]}
                  >
                    <Text style={styles.optionButtonText}>
                      {type === 'standard'
                        ? 'Standard'
                        : type === 'satellite'
                          ? 'Satellite'
                          : 'Hybrid'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.optionLabel}>Couleur de la traînée</Text>
                {theme.colors.ui.map.polyline.options.map((option) => (
                  <Pressable
                    key={option.label}
                    onPress={() => changePolylineColor(option.color)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      pressed && styles.optionButtonPressed,
                    ]}
                  >
                    <Text style={styles.optionButtonText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.optionLabel}>Icône du véhicule</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                  {[voiture, moto, camion, camionette].map((icon, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setSelectedVehicleIcon(icon);
                        const vehicleTypes = ['voiture', 'moto', 'camion', 'camionette'];
                        dispatch(setVehicleType(vehicleTypes[idx]));
                      }}
                    >
                      <Image
                        source={icon}
                        style={{ width: 80, height: 80, marginHorizontal: 10 }}
                      />
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.optionLabel}>Suivi de la position</Text>
                <Pressable
                  onPress={() => setUserControllingMap(false)}
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.optionButtonPressed,
                  ]}
                >
                  <Text>Suivi automatique</Text>
                </Pressable>
                <Pressable
                  onPress={() => setUserControllingMap(true)}
                  style={({ pressed }) => [
                    styles.optionButton,
                    pressed && styles.optionButtonPressed,
                  ]}
                >
                  <Text>Contrôle manuel</Text>
                </Pressable>
              </View>
            </ScrollView>
            <TouchableOpacity
              onPress={() => {
                lastInteractionTimeRef.current = Date.now(); // Reset du timer
                setCustomizationVisible(false);
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    <StartButtonModal
      actionSheetRef={actionSheetRef}
      onStartPress={handleStartTracking}
      isMapReady={mapReady}
    />
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    loadingImage: {
      width: 300,
      height: 200,
      tintColor: theme.colors.primary,
    },
    map: {
      width: '100%',
      height: '100%',
    },
    timerContainer: {
      position: 'absolute',
      top: theme.spacing.lg,
      alignSelf: 'center',
      backgroundColor: theme.colors.ui.map.timerBackground,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.large,
      borderColor: theme.colors.primary,
    },
    timerText: {
      color: theme.colors.ui.map.timerText,
      fontSize: theme.typography.title.fontSize,
      fontWeight: theme.typography.title.fontWeight,
    },
    visualButton: {
      position: 'absolute',
      top: theme.spacing.xxl,
      left: theme.spacing.md,
      backgroundColor: theme.colors.ui.modal.background,
      borderRadius: theme.borderRadius.xlarge,
      padding: theme.spacing.sm,
      ...theme.shadow.md,
    },
    visualIcon: {
      width: 44,
      height: 24,
      resizeMode: 'contain',
    },
    recenterButton: {
      position: 'absolute',
      bottom: 200,
      right: theme.spacing.md,
      backgroundColor: theme.colors.ui.map.recenterButton,
      borderRadius: theme.borderRadius.xlarge,
      padding: theme.spacing.md,
      elevation: 5,
      zIndex: 10,
      ...theme.shadow.md,
    },
    centerIcon: {
      width: 30,
      height: 30,
      backgroundColor: theme.colors.ui.map.recenterButton,
    },
    zoomControls: {
      position: 'absolute',
      top: theme.spacing.xxl,
      right: theme.spacing.md,
    },
    zoomButton: {
      backgroundColor: theme.colors.ui.button.secondary,
      borderRadius: theme.borderRadius.xlarge,
      padding: theme.spacing.sm,
      marginVertical: theme.spacing.xs,
      elevation: 5,
      borderWidth: 1,
      ...theme.shadow.xl,
    },
    icon: {
      fontSize: 22,
      textAlign: 'center',
      color: theme.colors.ui.button.secondaryText,
    },
    modalWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.colors.ui.modal.overlay,
    },
    modalPanel: {
      backgroundColor: theme.colors.ui.modal.background,
      padding: theme.spacing.lg,
      borderTopLeftRadius: theme.borderRadius.xlarge,
      borderTopRightRadius: theme.borderRadius.xlarge,
      maxHeight: '60%',
      ...theme.shadow.xl,
    },
    scrollContainer: {
      flexGrow: 0,
    },
    scrollContent: {
      paddingBottom: theme.spacing.sm,
    },
    modalTitle: {
      fontSize: theme.typography.header.fontSize,
      fontWeight: theme.typography.header.fontWeight,
      marginBottom: theme.spacing.md,
      alignSelf: 'center',
      color: theme.colors.backgroundText,
    },
    section: {
      marginBottom: theme.spacing.lg,
    },
    optionLabel: {
      fontWeight: theme.typography.subtitle.fontWeight,
      marginBottom: theme.spacing.sm,
      color: theme.colors.backgroundText,
    },
    optionButton: {
      backgroundColor: theme.colors.ui.card.background,
      borderRadius: theme.borderRadius.medium,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.xs,
      alignItems: 'center',
      ...theme.shadow.sm,
    },
    optionButtonPressed: {
      backgroundColor: theme.colors.ui.card.border,
    },
    optionButtonText: {
      color: theme.colors.backgroundText,
      fontSize: theme.typography.body.fontSize,
    },
    closeButton: {
      backgroundColor: theme.colors.ui.button.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xl,
      borderRadius: theme.borderRadius.medium,
      alignSelf: 'center',
      marginTop: theme.spacing.md,
      ...theme.shadow.md,
    },
    closeButtonText: {
      color: theme.colors.ui.button.primaryText,
      fontWeight: theme.typography.button.fontWeight,
    },
  });

// to do : optimiser l'aspect visuel en ajoutant une animation polyline
// mise en cache totale de map en fonction du lieu de vie de l'utilisateur
// tracer plus fluide en se basant pas que sur les point gps du store
// diférent mode de navigation
// api pour x ou y (ex speed)
// lancement analyse vide edge (faudrat ejecter pour fair cela full edge)
// landing page choix entre navigation libre ou "Mes trajets"/pre enregistrer
