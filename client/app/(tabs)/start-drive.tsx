import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions, Modal, Pressable, ScrollView } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region, AnimatedRegion, MarkerAnimated } from 'react-native-maps';
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

const { width, height } = Dimensions.get('window');
// temp d'inactivité avant le recentrage
const AUTO_FOLLOW_DELAY = 5000; // pour les tests 5 secondes en vrai 30 secondes serait mieux avant de ce recentrer automatiquement

export default function StartDriveScreen() {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const mapRef = useRef(null);
  const dispatch = useDispatch();
  const elapsedTime = useSelector((state: RootState) => state.chrono.elapsedTime);
  const isRunning = useSelector((state: RootState) => state.chrono.isRunning);
  const { latitude, longitude, path, tracking } = useSelector((state: RootState) => state.location);
  const [hasReceivedPosition, setHasReceivedPosition] = useState(false);
  const [lastValidPosition, setLastValidPosition] = useState({ latitude: null, longitude: null });

  const regionRef = useRef({
    latitude: latitude || 0,
    longitude: longitude || 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

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

  const animatedCoord = useMemo(() => new AnimatedRegion({
    latitude: latitude || 0,
    longitude: longitude || 0,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  }), []);

  // detecter les bord en fonction de notre position
  const isPositionNearEdge = useCallback(() => {
    if (!mapRef.current || !latitude || !longitude) {
      return false;
    }
    const region = regionRef.current;

    // Calculer les limites de la carte
    const latPadding = region.latitudeDelta * 0.2;
    const lngPadding = region.longitudeDelta * 0.2;

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
  }, [latitude, longitude]);

  // reset du timer si l'user a pas interagit
  const resetAutoFollowTimer = useCallback(() => {
    if (autoFollowTimerRef.current) {
      clearTimeout(autoFollowTimerRef.current);
    }

    lastInteractionTimeRef.current = Date.now();

    autoFollowTimerRef.current = setTimeout(() => {
      if (userControllingMap && (Date.now() - lastInteractionTimeRef.current >= AUTO_FOLLOW_DELAY)) {
        setUserControllingMap(false);
        console.log("remises en mode automatique");
      }
    }, AUTO_FOLLOW_DELAY);
  }, [userControllingMap]);

  const updateRegion = useCallback((lat, long, delta = regionRef.current.latitudeDelta) => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < UPDATE_INTERVAL_MS) {
      return;
    }

    lastUpdateTimeRef.current = now;
    lastPositionRef.current = { latitude: lat, longitude: long };

    const newRegion = {
      latitude: lat,
      longitude: long,
      latitudeDelta: delta,
      longitudeDelta: delta,
    };

    regionRef.current = newRegion;

    //  Centre la carte si la position est proche du bord et que ça fait plus de 5 secondes sans interaction utilisateur
    const shouldCenterMap =
      !userControllingMap ||
      (isPositionNearEdge() && (Date.now() - lastInteractionTimeRef.current > 5000));

    if (shouldCenterMap) {
      if (userControllingMap) {
        console.log("proche du bord recentrage");
        setUserControllingMap(false);
      }
      mapRef.current?.animateToRegion(newRegion, 500);
    }
  }, [userControllingMap, isPositionNearEdge]);

  useEffect(() => {
    if (latitude && longitude) {
      setHasReceivedPosition(true);
      setLastValidPosition({ latitude, longitude });

      updateRegion(latitude, longitude);
      animatedCoord.timing({
        latitude,
        longitude,
        duration: 500,
        useNativeDriver: false,
      }).start();
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

  const handleZoom = useCallback((zoomIn) => {
    if (!mapRef.current) return;
    const currentRegion = regionRef.current;
    const newDelta = zoomIn ? currentRegion.latitudeDelta / 2 : currentRegion.latitudeDelta * 2;
    const clampedDelta = Math.min(Math.max(newDelta, 0.0005), 0.5);

    const newRegion = {
      ...currentRegion,
      latitudeDelta: clampedDelta,
      longitudeDelta: clampedDelta,
    };
    regionRef.current = newRegion;
    mapRef.current.animateToRegion(newRegion, 350);
    setUserControllingMap(true);
    resetAutoFollowTimer();
  }, [resetAutoFollowTimer]);
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const changePolylineColor = useCallback((color) => {
    setPolylineColor(color);
  }, []);

  const changeMapType = useCallback((type) => {
    setMapType(type);
  }, []);

  // fonction pour le recentrage manuelle
  const recenterMap = useCallback(() => {
    setUserControllingMap(false);
    if (latitude && longitude) {
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: regionRef.current.latitudeDelta,
        longitudeDelta: regionRef.current.longitudeDelta,
      }, 500);
    }
  }, [latitude, longitude]);

  const handleMapDragStart = useCallback(() => {
    // si l'user à manipuler la carte
    setUserControllingMap(true);
    resetAutoFollowTimer();
  }, [resetAutoFollowTimer]);

  const polylineComponent = useMemo(() => {
    if (path.length > 1 && tracking) {
      return (
        <Polyline
          coordinates={path}
          strokeColor={polylineColor}
          strokeWidth={13}
        />
      );
    }
    return null;
  }, [path, tracking, polylineColor]);

  const markerComponent = useMemo(() => {
    if (latitude && longitude) {
      return (
        <MarkerAnimated
          coordinate={animatedCoord}
          anchor={{x: 0.7, y: 0.5}} // Valeurs par défaut pour le centrage
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

  if (!hasReceivedPosition) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={waitingIcone} style={styles.loadingImage}/>
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
        initialRegion={regionRef.current}
        mapType={mapType}
        moveOnMarkerPress={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onPanDrag={handleMapDragStart}
        onTouchStart={handleMapDragStart}
        onRegionChangeComplete={(region) => {
          regionRef.current = region;
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

      <TouchableOpacity style={styles.visualButton} onPress={() => setCustomizationVisible(true)}>
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
                {['standard', 'satellite', 'hybrid'].map(type => (
                  <Pressable
                    key={type}
                    onPress={() => changeMapType(type)}
                    style={({ pressed }) => [
                      styles.optionButton,
                      pressed && styles.optionButtonPressed,
                    ]}
                  >
                    <Text style={styles.optionButtonText}>{type === 'standard' ? 'Standard' : type === 'satellite' ? 'Satellite' : 'Hybrid'}</Text>
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
                      <Image source={icon} style={{ width: 80, height: 80, marginHorizontal: 10 }} />
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
            <TouchableOpacity onPress={() => setCustomizationVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background
  },
  loadingImage: {
    width: 300,
    height: 200,
    tintColor: theme.colors.primary
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
    zIndex: 10,
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
    backgroundColor: theme.colors.ui.button.secondary,
    borderRadius: theme.borderRadius.xlarge,
    padding: theme.spacing.sm,
    elevation: 5,
    zIndex: 10,
    ...theme.shadow.md
  },
  visualIcon: {
    width: 44,
    height: 24,
    resizeMode: 'contain',
  },
  recenterButton: {
    position: 'absolute',
    bottom: theme.spacing.xxl,
    right: theme.spacing.md,
    backgroundColor: theme.colors.ui.map.recenterButton,
    borderRadius: theme.borderRadius.xlarge,
    padding: theme.spacing.md,
    elevation: 5,
    zIndex: 10,
    ...theme.shadow.md
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
    ...theme.shadow.sm
  },
  icon: {
    fontSize: 22,
    textAlign: 'center',
    color: theme.colors.ui.button.secondaryText
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
    ...theme.shadow.xl
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
    color: theme.colors.backgroundText
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  optionLabel: {
    fontWeight: theme.typography.subtitle.fontWeight,
    marginBottom: theme.spacing.sm,
    color: theme.colors.backgroundText
  },
  optionButton: {
    backgroundColor: theme.colors.ui.card.background,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    alignItems: 'center',
    ...theme.shadow.sm
  },
  optionButtonPressed: {
    backgroundColor: theme.colors.ui.card.border,
  },
  optionButtonText: {
    color: theme.colors.backgroundText,
    fontSize: theme.typography.body.fontSize
  },
  closeButton: {
    backgroundColor: theme.colors.ui.button.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.medium,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadow.md
  },
  closeButtonText: {
    color: theme.colors.ui.button.primaryText,
    fontWeight: theme.typography.button.fontWeight
  }
});



// to do : optimiser l'aspect visuel en ajoutant une animation polyline
// mise en cache totale de map en fonction du lieu de vie de l'utilisateur
// tracer plus fluide en se basant pas que sur les point gps du store
// diférent mode de navigation
// api pour x ou y (ex speed)
// lancement analyse vide edge (faudrat ejecter pour fair cela full edge)
// landing page choix entre navigation libre ou "Mes trajets"/pre enregistrer
