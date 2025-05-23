import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../constants/theme';
import { CustomSlider } from '../common/CustomSlider';

const VEHICLES = ['voiture', 'moto', 'camion', 'camionette'];
const COUNTRIES = [
  'France', 'Belgium', 'Germany', 'Italy', 'Spain', 'Netherlands',
  'Switzerland', 'Austria', 'Portugal', 'Other'
];
const OFFLINE_OPTIONS = ['Tous', 'En ligne', 'Hors ligne'];
/*
  important c'est volontaire que si pas de connection avec la db
  (que ce soit le questionnaire offline qui sync avec la db par facilité on consider ce genre de trajet comme offline
  (meme si techniquement l'user avait peut etre de la connection mais pas avec la db a cause de probleme  interne au serveur)

*/

const QueryCarousel = ({ onFiltersChange }) => {
  const [filters, setFilters] = useState({
    country: '',
    vehicle: '',
    minDistance: 0,
    maxDistance: 500,
    minDuration: 0,
    maxDuration: 300,
    limit: 10,
    offline: 'Tous',
  });

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const theme = useTheme();
  const styles = makeStyles(theme);

  const updateFilter = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const updateRangeFilter = (key, values) => {
    const newFilters = {
      ...filters,
      [`min${key}`]: Math.round(values[0]),
      [`max${key}`]: Math.round(values[1])
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = {
      country: '',
      vehicle: '',
      minDistance: 0,
      maxDistance: 500,
      minDuration: 0,
      maxDuration: 300,
      limit: 10,
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
    setExpandedSection(null);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderDropdownSection = (title: string, options: string[], currentValue: string, onSelect: (value: string) => void) => (
    <View style={styles.dropdownSection}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => toggleSection(title)}
      >
        <Text style={styles.dropdownTitle}>
          {title}: <Text style={styles.selectedValue}>{currentValue || 'Sélectionner'}</Text>
        </Text>
        <MaterialIcons
          name={expandedSection === title ? 'keyboard-arrow-down' : 'more-vert'}
          size={24}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {expandedSection === title && (
        <View style={styles.dropdownOptions}>
          {options.map(option => (
            <TouchableOpacity
              key={option}
              style={[
                styles.dropdownOption,
                currentValue === option && styles.dropdownOptionActive
              ]}
              onPress={() => {
                onSelect(option);
                toggleSection(title);
              }}
            >
              <Text style={[
                styles.dropdownOptionText,
                currentValue === option && styles.dropdownOptionTextActive
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderRangeSlider = (title: string, minKey: string, maxKey: string, min: number, max: number, unit: string) => {

    return (
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>
          {title}: {filters[minKey]} - {filters[maxKey]} {unit}
        </Text>
        <CustomSlider
          value={[filters[minKey], filters[maxKey]]}
          onValueChange={(values) => {
            updateRangeFilter(title, values);
          }}
          min={min}
          max={max}
          step={1}
        />
      </View>
    );
  };

  const renderSingleSlider = (title: string, key: string, min: number, max: number, unit: string) => (
    <View style={styles.sliderContainer}>
      <Text style={styles.sliderLabel}>
        {title}: {filters[key]} {unit}
      </Text>
      <CustomSlider
        value={[filters[key]]}
        onValueChange={(values) => updateFilter(key, Math.round(values[0]))}
        min={min}
        max={max}
        step={1}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.headerTitle}>Filtrer les trajets</Text>
        <Text style={styles.headerSubtitle}>
          Configurez vos critères de recherche
        </Text>

        {renderDropdownSection(
          'Pays/Lieu',
          COUNTRIES,
          filters.country,
          (value) => updateFilter('country', value)
        )}
        {renderDropdownSection(
          'Connexion',
          OFFLINE_OPTIONS,
          filters.offline,
          (value) => updateFilter('offline', value)
        )}
        {renderDropdownSection(
          'Véhicule',
          VEHICLES,
          filters.vehicle,
          (value) => updateFilter('vehicle', value)
        )}

        {renderRangeSlider('Distance', 'minDistance', 'maxDistance', 0, 500, 'km')}
        {renderRangeSlider('Duration', 'minDuration', 'maxDuration', 0, 300, 'min')}
        {renderSingleSlider('Nombre de résultats', 'limit', 1, 20, 'trajets')}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
          <Text style={styles.clearButtonText}>Réinitialiser les filtres</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flex: 1,
    },
    scrollContent: {
      padding: theme.spacing.md,
      paddingBottom: 140,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.backgroundText,
      textAlign: 'center',
      marginBottom: theme.spacing.sm,
      marginTop: 25,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.colors.backgroundTextSoft,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
      lineHeight: 20,
    },
    dropdownSection: {
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.ui.card.background,
      borderRadius: theme.borderRadius.medium,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dropdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    dropdownTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.backgroundText,
    },
    selectedValue: {
      fontWeight: '500',
      color: theme.colors.primary,
    },
    dropdownOptions: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    dropdownOption: {
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    dropdownOptionActive: {
      backgroundColor: theme.colors.primary,
    },
    dropdownOptionText: {
      fontSize: 14,
      color: theme.colors.backgroundText,
    },
    dropdownOptionTextActive: {
      color: theme.colors.ui.button.primaryText,
      fontWeight: '600',
    },
    sliderContainer: {
      marginBottom: theme.spacing.lg,
      backgroundColor: theme.colors.ui.card.background,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    sliderLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.backgroundText,
      marginBottom: theme.spacing.md,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      ...theme.shadow.sm,
    },
    clearButton: {
      backgroundColor: theme.colors.ui.button.primary,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.medium,
      alignItems: 'center',
      paddingBottom : 70,
    },
    clearButtonText: {
      color: theme.colors.ui.button.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
  });

export default QueryCarousel;

//c'est des filtres pas des query mais a terme ici ca devrais etre des query directment!