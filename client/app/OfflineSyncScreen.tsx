import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  selectPendingItems,
  selectSyncErrors,
  clearAllPendingItems,
  removePendingItem,
} from './store/slices/syncSlice';
import { selectIsInternetReachable } from './store/slices/networkSlice';
import { removePendingDriveSession } from './utils/storageUtils';
import Toast from 'react-native-toast-message';
import { useTheme } from './constants/theme';
import CleanupStorage from './components/ui/ClearAllLocalStorage';
import { store } from './store/store';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import { logger } from './utils/logger';

type SyncItemType = {
  id: string;
  type: 'trajet' | 'roadbook' | 'profile' | 'other' | 'api';
  data: any;
  createdAt: number;
};

const DetailRow = React.memo(
  ({ label, value, theme }: { label: string; value: string; theme: Theme }) => (
    <View style={[styles.detailRow, { marginBottom: theme.spacing.xs }]}>
      <Text
        style={[
          styles.detailLabel,
          theme.typography.body,
          { color: theme.colors.backgroundTextSoft },
        ]}
      >
        {label}:
      </Text>
      <Text
        style={[styles.detailValue, theme.typography.body, { color: theme.colors.backgroundText }]}
      >
        {value}
      </Text>
    </View>
  )
);

const SyncItemComponent = React.memo(
  ({
    item,
    theme,
    isExpanded,
    hasError,
    onPress,
    onDelete,
    formatDate,
    formatDuration,
    formatVehicle,
    getTypeColor,
    getTypeLabel,
    getItemTitle,
  }: {
    item: SyncItemType;
    theme: Theme;
    isExpanded: boolean;
    hasError: boolean;
    onPress: () => void;
    onDelete: () => void;
    formatDate: (date: Date) => string;
    formatDuration: (seconds: number) => string;
    formatVehicle: (vehicle: string | null) => string;
    getTypeColor: (type: string) => string;
    getTypeLabel: (type: string) => string;
    getItemTitle: (item: SyncItemType) => string;
  }) => {
    const itemDate = new Date(item.createdAt);
    const typeColor = getTypeColor(item.type);

    return (
      <View
        style={[
          styles.itemContainer,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.ui.card.background,
            borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.itemHeader, { padding: theme.spacing.sm }]}
          onPress={onPress}
        >
          <View style={styles.itemTitleContainer}>
            <View
              style={[
                styles.itemTypeBadge,
                {
                  backgroundColor: typeColor,
                  borderRadius: theme.borderRadius.small,
                  marginRight: theme.spacing.sm,
                },
              ]}
            >
              <Text
                style={[
                  styles.itemTypeText,
                  theme.typography.caption,
                  { color: theme.colors.primaryText },
                ]}
              >
                {getTypeLabel(item.type)}
              </Text>
            </View>
            <Text
              style={[
                styles.itemTitle,
                theme.typography.subtitle,
                { color: theme.colors.backgroundText },
              ]}
            >
              {getItemTitle(item)}
            </Text>
          </View>
          <View style={styles.itemMeta}>
            <TouchableOpacity
              style={[styles.deleteButton, { marginRight: theme.spacing.sm }]}
              onPress={onDelete}
            >
              <Ionicons
                name="trash-outline"
                size={theme.typography.body.fontSize}
                color={theme.colors.ui.button.danger}
              />
            </TouchableOpacity>
            {hasError && (
              <Ionicons
                name="alert-circle"
                size={theme.typography.body.fontSize}
                color={theme.colors.ui.status.error}
                style={{ marginRight: theme.spacing.sm }}
              />
            )}
            <Text
              style={[
                styles.itemDate,
                theme.typography.caption,
                {
                  color: theme.colors.backgroundTextSoft,
                  marginRight: theme.spacing.sm,
                },
              ]}
            >
              {formatDate(itemDate)}
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={theme.typography.body.fontSize}
              color={theme.colors.backgroundTextSoft}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View
            style={[
              styles.itemDetails,
              {
                borderTopColor: theme.colors.border,
                backgroundColor: theme.colors.ui.card.background,
                padding: theme.spacing.sm,
              },
            ]}
          >
            {hasError && (
              <View
                style={[
                  styles.errorBox,
                  {
                    backgroundColor: theme.colors.ui.status.error + '20',
                    borderRadius: theme.borderRadius.small,
                    padding: theme.spacing.sm,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.errorText,
                    theme.typography.body,
                    { color: theme.colors.ui.status.error },
                  ]}
                >
                  {hasError}
                </Text>
              </View>
            )}

            {item.type === 'trajet' && (
              <View style={styles.detailsContent}>
                <DetailRow
                  label="Durée"
                  value={formatDuration(item.data.elapsedTime)}
                  theme={theme}
                />
                <DetailRow
                  label="Points GPS"
                  value={item.data.path.length.toString()}
                  theme={theme}
                />
                <DetailRow
                  label="Véhicule"
                  value={formatVehicle(item.data.vehicle)}
                  theme={theme}
                />
                {item.data.weather && (
                  <DetailRow
                    label="Météo"
                    value={`${item.data.weather.temperature}°C, ${item.data.weather.conditions}`}
                    theme={theme}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }
);

const OfflineSyncScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const router = useRouter();
  const pendingItems = useSelector(selectPendingItems);
  const isOnline = useSelector(selectIsInternetReachable);
  const syncErrors = useSelector(selectSyncErrors);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    let lastUpdate = 0;
    const unsubscribe = store.subscribe(() => {
      const now = Date.now();
      if (now - lastUpdate > 500) {
        lastUpdate = now;
        setForceUpdate((prev) => prev + 1);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDeleteItem = useCallback(
    (item: SyncItemType) => {
      if (item.type === 'api') {
        Toast.show({
          type: 'info',
          text1: 'Information',
          text2: 'Les requêtes API ne peuvent pas être supprimées manuellement',
          position: 'bottom',
        });
        return;
      }

      Alert.alert('Confirmation', 'Supprimer cet élément en attente de synchronisation ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.type === 'trajet') {
                await removePendingDriveSession(item.id);
              }
              dispatch(removePendingItem({ id: item.id }));
              Toast.show({
                type: 'success',
                text1: 'Élément supprimé',
                text2: "L'élément ne sera pas synchronisé",
                position: 'bottom',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Erreur',
                text2: "Impossible de supprimer l'élément",
                position: 'bottom',
              });
              logger.error('Erreur lors de la suppression:', error);
            }
          },
        },
      ]);
    },
    [dispatch]
  );

  const handleClearAll = useCallback(() => {
    if (pendingItems.length === 0) return;

    Alert.alert(
      'Confirmation',
      'Êtes-vous sûr de vouloir supprimer tous les éléments en attente ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: () => {
            dispatch(clearAllPendingItems({}));
            Toast.show({
              type: 'success',
              text1: 'Données effacées',
              text2: 'Tous les éléments en attente ont été supprimés',
              position: 'bottom',
            });
          },
        },
      ]
    );
  }, [dispatch, pendingItems.length]);

  const toggleItemExpanded = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const getTypeColor = useCallback(
    (type: string) => {
      switch (type) {
        case 'trajet':
          return theme.colors.ui.button.primary;
        case 'roadbook':
          return theme.colors.ui.status.success;
        case 'profile':
          return theme.colors.ui.status.warning;
        default:
          return theme.colors.ui.status.info;
      }
    },
    [theme]
  );

  const getTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'trajet':
        return 'Trajet';
      case 'roadbook':
        return 'Roadbook';
      case 'profile':
        return 'Profil';
      default:
        return 'Autre';
    }
  }, []);

  const getItemTitle = useCallback((item: SyncItemType) => {
    if (item.type === 'trajet') {
      return `Trajet du ${formatDate(new Date(item.createdAt))}`;
    }
    return `Élément ${item.id.substring(0, 8)}`;
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  const formatVehicle = useCallback((vehicle: string | null) => {
    if (!vehicle) return 'Non spécifié';
    const vehicles: Record<string, string> = {
      moto: 'Moto',
      voiture: 'Voiture',
      camion: 'Camion',
      camionnette: 'Camionnette',
    };
    return vehicles[vehicle] || vehicle;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: SyncItemType }) => (
      <SyncItemComponent
        item={item}
        theme={theme}
        isExpanded={expandedItems.has(item.id)}
        hasError={syncErrors[item.id]}
        onPress={() => toggleItemExpanded(item.id)}
        onDelete={() => handleDeleteItem(item)}
        formatDate={formatDate}
        formatDuration={formatDuration}
        formatVehicle={formatVehicle}
        getTypeColor={getTypeColor}
        getTypeLabel={getTypeLabel}
        getItemTitle={getItemTitle}
      />
    ),
    [
      theme,
      expandedItems,
      syncErrors,
      toggleItemExpanded,
      handleDeleteItem,
      formatDate,
      formatDuration,
      formatVehicle,
      getTypeColor,
      getTypeLabel,
      getItemTitle,
    ]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          padding: theme.spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.statusCard,
          {
            backgroundColor: theme.colors.ui.card.background,
            borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.md,
            padding: theme.spacing.sm,
            ...theme.shadow.sm,
          },
        ]}
        accessibilityLabel={isOnline ? 'Connecté à Internet' : 'Hors ligne'}
      >
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: isOnline
                ? theme.colors.ui.status.success
                : theme.colors.ui.status.error,
              borderRadius: theme.borderRadius.large,
              height: 6,
            },
          ]}
        />
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.backgroundTextSoft,
              marginTop: theme.spacing.xs,
              textAlign: 'center',
            },
          ]}
        >
          {isOnline ? 'Connecté à Internet' : 'Mode hors ligne'}
        </Text>
      </View>

      <View
        style={[
          styles.cleanupContainer,
          {
            backgroundColor: theme.colors.ui.card.background,
            borderRadius: theme.borderRadius.medium,
            marginBottom: theme.spacing.md,
            ...theme.shadow.sm,
          },
        ]}
      >
        <CleanupStorage />
      </View>

      <View
        style={[
          styles.listHeaderContainer,
          {
            marginBottom: theme.spacing.sm,
            paddingHorizontal: theme.spacing.sm,
          },
        ]}
      >
        <Text style={[theme.typography.title, { color: theme.colors.backgroundText }]}>
          Éléments en attente ({pendingItems.length})
        </Text>
      </View>

      {pendingItems.length === 0 ? (
        <View
          style={[
            styles.emptyContainer,
            {
              padding: theme.spacing.lg,
              marginTop: theme.spacing.xxl,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={64} color={theme.colors.ui.status.success} />
          <Text
            style={[
              theme.typography.subtitle,
              {
                color: theme.colors.backgroundTextSoft,
                marginTop: theme.spacing.md,
                textAlign: 'center',
              },
            ]}
          >
            Aucun élément en attente de synchronisation
          </Text>
        </View>
      ) : (
        <FlatList
          key={`pending-list-${forceUpdate}`}
          data={pendingItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingBottom: theme.spacing.xl,
            paddingHorizontal: theme.spacing.sm,
          }}
          extraData={forceUpdate}
        />
      )}
      <GoBackHomeButton containerStyle={{ marginTop: theme.spacing.md }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusCard: {
    alignItems: 'center',
  },
  statusIndicator: {
    width: '100%',
  },
  listHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemTypeText: {
    fontWeight: 'bold',
  },
  itemTitle: {
    flex: 1,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 2,
  },
  itemDate: {},
  itemDetails: {
    borderTopWidth: 1,
  },
  errorBox: {},
  errorText: {},
  detailsContent: {},
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontWeight: '500',
  },
  detailValue: {},
  cleanupContainer: {},
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(OfflineSyncScreen);
