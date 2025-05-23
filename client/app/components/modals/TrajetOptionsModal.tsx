import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  ImageBackground,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { formatElapsedTime } from '../../utils/firebase/driveSessionUtils';
import { reverseGeocode } from '../../services/api/geocoding.api';
import { getWeatherImageSource, getWeatherDescription } from '../../utils/weatherUtils';
import { logger } from '../../utils/logger';
import { MaterialIcons } from '@expo/vector-icons';

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

interface WeatherInfo {
  temperature: number;
  conditions: string;
  windSpeed: number;
  visibility: number;
  humidity: number;
  pressure: number;
}

interface TrajetDetailsProps {
  id: string;
  nom: string;
  description: string;
  path: Point[];
  createdAt: any;
  vehicle: string;
  weather: WeatherInfo | string;
  elapsedTime: number;
  roadInfo?: RoadInfo;
  notes?: string;
}

interface TrajetOptionsModalProps {
  trajet: TrajetDetailsProps | null;
  visible: boolean;
  onClose: () => void;
  onSaveNotes: (sessionId: string, notes: string) => Promise<void>;
}

const TrajetOptionsModal: React.FC<TrajetOptionsModalProps> = ({
  trajet,
  visible,
  onClose,
  onSaveNotes
}) => {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(trajet?.notes || '');
  const theme = useTheme();
  const styles = createStyles(theme);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [startAddress, setStartAddress] = useState<string>('');
  const [endAddress, setEndAddress] = useState<string>('');

  useEffect(() => {
    setEditedNotes(trajet?.notes || '');
    setIsEditingNotes(false);
  }, [trajet]);

  const handleSaveNotes = async () => {
    if (trajet) {
      await onSaveNotes(trajet.id, editedNotes);
      setIsEditingNotes(false);
    }
  };
  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      const fetchAddresses = async () => {
        if (trajet && trajet.path.length >= 2) {
          const start = trajet.path[0];
          const end = trajet.path[trajet.path.length - 1];

          try {
            const startAddr = await reverseGeocode(start.latitude, start.longitude);
            const endAddr = await reverseGeocode(end.latitude, end.longitude);

            setStartAddress(startAddr);
            setEndAddress(endAddr);
          } catch (error) {
            logger.error('Erreur lors du géocodage inverse:', error);
          }
        }
      };

      fetchAddresses();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, trajet]);

  if (!trajet) return null;

  // Gestion de la météo
  const weatherConditions =
    typeof trajet.weather === 'string' ? trajet.weather : trajet.weather?.conditions || 'Inconnu';

  const weatherImageSource = getWeatherImageSource(weatherConditions);
  const weatherDesc = getWeatherDescription(weatherConditions);

  const totalDistance = trajet?.roadInfo?.summary?.totalDistanceKm
    ? `${trajet.roadInfo.summary.totalDistanceKm.toFixed(2)} km`
    : 'Non disponible';

  const averageSpeed = trajet?.roadInfo?.speed?.average
    ? `${trajet.roadInfo.speed.average.toFixed(1)} km/h`
    : 'Non disponible';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <View style={styles.modalContent}>
          <ImageBackground
            source={weatherImageSource}
            style={styles.weatherHeader}
            imageStyle={styles.weatherBackgroundImage}
          >
            <View style={styles.weatherHeaderOverlay}>
              <Text style={styles.modalTitle}>Détails du trajet</Text>
              <Text style={styles.weatherConditionText}>{weatherDesc}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                <Text style={styles.closeIconText}>×</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>

          <ScrollView style={styles.scrollContent}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Informations générales</Text>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Date</Text>
                <Text style={styles.dataValue}>
                  {new Date(trajet.createdAt.seconds * 1000).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Durée</Text>
                <Text style={styles.dataValue}>{formatElapsedTime(trajet.elapsedTime)}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Véhicule</Text>
                <Text style={styles.dataValue}>{trajet.vehicle}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parcours</Text>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Départ</Text>
                <Text style={styles.dataValue}>
                  {startAddress ||
                    `${trajet.path[0]?.latitude.toFixed(5)}, ${trajet.path[0]?.longitude.toFixed(5)}`}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Arrivée</Text>
                <Text style={styles.dataValue}>
                  {endAddress ||
                    `${trajet.path[trajet.path.length - 1]?.latitude.toFixed(5)}, ${trajet.path[trajet.path.length - 1]?.longitude.toFixed(5)}`}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Distance</Text>
                <Text style={styles.dataValue}>{totalDistance}</Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Vitesse moyenne</Text>
                <Text style={styles.dataValue}>{averageSpeed}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Météo</Text>
              {typeof trajet.weather === 'object' ? (
                <>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Conditions</Text>
                    <Text style={styles.dataValue}>{weatherConditions}</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Température</Text>
                    <Text style={styles.dataValue}>{trajet.weather.temperature}°C</Text>
                  </View>
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>Vent</Text>
                    <Text style={styles.dataValue}>{trajet.weather.windSpeed} km/h</Text>
                  </View>
                </>
              ) : (
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Conditions</Text>
                  <Text style={styles.dataValue}>{weatherConditions}</Text>
                </View>
              )}
            </View>

            {/* Section Notes ajoutée */}
            {trajet.notes || isEditingNotes ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Notes</Text>
                  {!isEditingNotes ? (
                    <TouchableOpacity onPress={() => setIsEditingNotes(true)} style={styles.editIconButton}>
                      <MaterialIcons name="edit" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={handleSaveNotes} style={styles.saveIconButton}>
                      <MaterialIcons name="check" size={18} color={theme.colors.success} />
                    </TouchableOpacity>
                  )}
                </View>
                {isEditingNotes ? (
                  <TextInput
                    style={styles.notesInput}
                    multiline
                    value={editedNotes}
                    onChangeText={setEditedNotes}
                    placeholder="Ajoutez vos notes ici..."
                  />
                ) : (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesText}>{trajet.notes}</Text>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addNotesButton}
                onPress={() => setIsEditingNotes(true)}
              >
                <Text style={styles.addNotesText}>+ Ajouter des notes</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.colors.ui.modal.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.colors.ui.modal.background,
      width: '85%',
      borderRadius: theme.borderRadius.large,
      overflow: 'hidden',
      ...theme.shadow.lg,
    },
    weatherHeader: {
      height: 120,
      width: '100%',
      justifyContent: 'flex-end',
    },
    weatherBackgroundImage: {
      opacity: 0.85,
    },
    weatherHeaderOverlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      padding: theme.spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: '100%',
    },
    modalTitle: {
      ...theme.typography.header,
      color: theme.colors.primaryText,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
      top: -20,
    },
    weatherConditionText: {
      ...theme.typography.subtitle,
      color: theme.colors.primaryText,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 3,
      position: 'absolute',
      bottom: theme.spacing.lg,
      left: theme.spacing.lg,
      opacity: 0.9,
    },
    closeIcon: {
      width: 36,
      height: 36,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'absolute',
      top: theme.spacing.md,
      right: theme.spacing.md,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: theme.borderRadius.xlarge,
    },
    closeIconText: {
      fontSize: 24,
      color: theme.colors.primaryText,
      fontWeight: 'bold',
      lineHeight: 24,
    },
    scrollContent: {
      maxHeight: 400,
    },
    section: {
      padding: theme.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.ui.card.border,
    },
    sectionTitle: {
      ...theme.typography.title,
      color: theme.colors.primary,
      marginBottom: theme.spacing.sm,
    },
    dataRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
    },
    dataLabel: {
      ...theme.typography.body,
      color: theme.colors.backgroundTextSoft,
      flex: 1,
    },
    dataValue: {
      ...theme.typography.body,
      fontWeight: '500',
      color: theme.colors.backgroundText,
      flex: 2,
      textAlign: 'right',
    },
    notesContainer: {
      backgroundColor: theme.colors.ui.card.background,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.ui.card.border,
    },
    notesText: {
      ...theme.typography.body,
      color: theme.colors.backgroundText,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    closeButton: {
      backgroundColor: theme.colors.ui.button.primary,
      padding: theme.spacing.md,
      margin: theme.spacing.lg,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      ...theme.shadow.md,
    },
    editIconButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.small,
    },
    saveIconButton: {
      padding: theme.spacing.xs,
      borderRadius: theme.borderRadius.small,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    editButton: {
      color: theme.colors.primary,
      ...theme.typography.button,
    },
    saveButton: {
      color: theme.colors.success,
      ...theme.typography.button,
    },
    notesInput: {
      backgroundColor: theme.colors.ui.card.background,
      borderRadius: theme.borderRadius.medium,
      padding: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.ui.card.border,
      minHeight: 100,
      textAlignVertical: 'top',
      ...theme.typography.body,
    },
    addNotesButton: {
      padding: theme.spacing.md,
      alignItems: 'center',
      margin: theme.spacing.lg,
      backgroundColor: theme.colors.ui.button.secondary,
      borderRadius: theme.borderRadius.medium,
    },
    addNotesText: {
      color: theme.colors.ui.button.secondaryText,
      ...theme.typography.button,
    },
    closeText: {
      ...theme.typography.button,
      color: theme.colors.ui.button.primaryText,
    },
  });

export default TrajetOptionsModal;