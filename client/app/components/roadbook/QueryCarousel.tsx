import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { roadbookApi } from '../../services/api/roadbook.api';
import { useNotifications } from '../NotificationHandler';
import { CustomSlider } from '../common/CustomSlider';
import { formatDateRange } from '../../utils/dateUtils';

const VEHICLES = ['voiture', 'moto', 'camion', 'camionette'];
const COUNTRIES = [
  'France', 'Germany', 'Italy', 'Spain', 'Belgium', 'Netherlands',
  'Switzerland', 'Austria', 'Portugal', 'Poland', 'Other'
];

export default function QueryCarousel({ onResults }) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { showError, showInfo } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    limit: 5,
    days: 30,
    minDistance: 0,
    maxDistance: 1000,
    minDuration: 0,
    maxDuration: 600,
    vehicle: '',
    country: '',
  });

  // Convertir les sessions API vers le format attendu par TrajetsCarousel
  const convertToCarouselFormat = (sessions) => {
    return sessions.map(session => ({
      id: session.id,
      nom: session.title || `Trajet du ${new Date(session.date).toLocaleDateString()}`,
      description: session.description || '',
      path: [], // Pas de données GPS dans l'API actuelle
      createdAt: { seconds: new Date(session.date).getTime() / 1000 },
      vehicle: session.vehicle || 'Inconnu',
      weather: session.weather || 'Non disponible',
      elapsedTime: Math.round(session.duration * 60), // Convertir en secondes
      roadInfo: {
        summary: {
          totalDistanceKm: session.distance,
          totalDurationMinutes: session.duration,
          trafficDelayMinutes: 0
        },
        speed: {
          average: session.distance > 0 ? (session.distance / (session.duration / 60)) : 0
        }
      },
      notes: session.notes,
      roadbookTitle: session.roadbookTitle,
      roadbookId: session.roadbookId
    }));
  };

  const filterSessions = (sessions) => {
    return sessions.filter(session => {
      // Filtre par distance
      if (session.distance) {
        if (session.distance < filters.minDistance || session.distance > filters.maxDistance) {
          return false;
        }
      }

      // Filtre par durée
      if (session.duration) {
        if (session.duration < filters.minDuration || session.duration > filters.maxDuration) {
          return false;
        }
      }

      // Filtre par véhicule (quand disponible)
      if (filters.vehicle && session.vehicle) {
        if (session.vehicle.toLowerCase() !== filters.vehicle.toLowerCase()) {
          return false;
        }
      }

      // Filtre par pays (logique préparée pour quand les données GPS seront disponibles)
      if (filters.country && session.country) {
        if (session.country !== filters.country) {
          return false;
        }
      }

      return true;
    }).slice(0, filters.limit);
  };

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      showInfo('Recherche en cours...');

      const roadbooks = await roadbookApi.getUserRoadbooks();
      let allSessions = [];

      for (const roadbook of roadbooks) {
        try {
          const sessions = await roadbookApi.getRoadbookSessions(roadbook.id);
          const enrichedSessions = sessions.map(session => ({
            ...session,
            roadbookTitle: roadbook.title,
            roadbookId: roadbook.id
          }));
          allSessions.push(...enrichedSessions);
        } catch (error) {
          console.warn(`Erreur roadbook ${roadbook.id}:`, error);
        }
      }

      // Filtrer par période
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - filters.days);

      const recentSessions = allSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= startDate && sessionDate <= endDate;
      });

      const filteredSessions = filterSessions(recentSessions);

      // Convertir au format attendu par TrajetsCarousel
      const carouselSessions = convertToCarouselFormat(filteredSessions);

      if (carouselSessions.length === 0) {
        showInfo('Aucun résultat trouvé');
      } else {
        showInfo(`${carouselSessions.length} session(s) trouvée(s)`);
      }

      onResults(carouselSessions);
    } catch (error) {
      showError('Erreur de recherche');
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, onResults, showError, showInfo]);

  const renderSlider = (title, value, onChange, min, max, unit, isRange = false) => (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <CustomSlider
        value={isRange ? [value.min, value.max] : [value]}
        onValueChange={onChange}
        min={min}
        max={max}
        step={1}
      />
      <Text style={styles.value}>
        {isRange ? `${value.min} - ${value.max} ${unit}` : `${value} ${unit}`}
      </Text>
    </View>
  );

  const renderSelector = (title, options, selectedValue, onChange) => (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.chip, !selectedValue && styles.chipSelected]}
          onPress={() => onChange('')}
        >
          <Text style={[styles.chipText, !selectedValue && styles.chipTextSelected]}>
            Tous
          </Text>
        </TouchableOpacity>
        {options.map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.chip, selectedValue === option && styles.chipSelected]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.chipText, selectedValue === option && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.title}>Période</Text>
        <Text style={styles.dateRange}>{formatDateRange(filters.days)}</Text>
        <CustomSlider
          value={[filters.days]}
          onValueChange={v => setFilters(p => ({...p, days: Math.round(v[0])}))}
          min={1}
          max={365}
          step={1}
        />
        <Text style={styles.value}>{filters.days} jours</Text>
      </View>

      {renderSlider(
        'Nombre de résultats',
        filters.limit,
        v => setFilters(p => ({...p, limit: Math.round(v[0])})),
        1, 20, 'résultats'
      )}

      {renderSlider(
        'Distance (km)',
        { min: filters.minDistance, max: filters.maxDistance },
        v => setFilters(p => ({
          ...p,
          minDistance: Math.round(v[0]),
          maxDistance: Math.round(v[1])
        })),
        0, 1000, 'km', true
      )}

      {renderSlider(
        'Durée (min)',
        { min: filters.minDuration, max: filters.maxDuration },
        v => setFilters(p => ({
          ...p,
          minDuration: Math.round(v[0]),
          maxDuration: Math.round(v[1])
        })),
        0, 600, 'min', true
      )}

      {renderSelector(
        'Véhicule',
        VEHICLES,
        filters.vehicle,
        v => setFilters(p => ({...p, vehicle: v}))
      )}

      {renderSelector(
        'Pays',
        COUNTRIES,
        filters.country,
        v => setFilters(p => ({...p, country: v}))
      )}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSearch}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Rechercher</Text>
        )}
      </TouchableOpacity>

      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors?.backgroundText || '#000',
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: theme.colors?.backgroundText || '#000',
    textAlign: 'center',
    marginTop: 8,
  },
  dateRange: {
    fontSize: 14,
    color: theme.colors?.backgroundTextSoft || '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: theme.colors?.ui?.card?.background || '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors?.ui?.card?.border || '#ddd',
  },
  chipSelected: {
    backgroundColor: theme.colors?.primary || '#007AFF',
    borderColor: theme.colors?.primary || '#007AFF',
  },
  chipText: {
    fontSize: 14,
    color: theme.colors?.backgroundText || '#000',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  button: {
    backgroundColor: theme.colors?.primary || '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpace: {
    height: 32,
  },
});