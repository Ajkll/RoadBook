import React from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../../constants/theme';
import MarketplaceItemCard from './MarketplaceItemCard';
import { Ionicons } from '@expo/vector-icons';

interface MarketplaceListProps {
  items: MarketplaceItem[];
  currentUser: any;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onDeleteItem: (itemId: string) => void;
  onBuyItem: (itemId: string) => void;
}

const MarketplaceList: React.FC<MarketplaceListProps> = ({
  items,
  currentUser,
  loading,
  refreshing,
  onRefresh,
  onDeleteItem,
  onBuyItem
}) => {
  const { colors, spacing } = useTheme();

  const handleRefresh = async () => {
    try {
      await onRefresh();
    } catch (error) {
      // Handle error silently or show appropriate message
    }
  };

  // Filtrer les articles disponibles (non vendus, non supprimés)
  const availableItems = items.filter(item => !item.isSold && !item.isDeleted);

  const renderItem = ({ item }) => (
    <MarketplaceItemCard
      item={item}
      currentUser={currentUser}
      onDeleteItem={onDeleteItem}
      onBuyItem={onBuyItem}
    />
  );

  const renderEmptyComponent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.backgroundTextSoft }]}>
            Chargement des articles...
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="storefront-outline" size={80} color={colors.backgroundTextSoft} />
        <Text style={[styles.emptyTitle, { color: colors.backgroundText }]}>
          Aucun article disponible
        </Text>
        <Text style={[styles.emptyText, { color: colors.backgroundTextSoft }]}>
          {items.length === 0
            ? 'Soyez le premier à publier un article !'
            : 'Tous les articles ont été vendus ou supprimés.'
          }
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (loading && availableItems.length > 0) {
      return (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingMoreText, { color: colors.backgroundTextSoft }]}>
            Chargement...
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <FlatList
      data={availableItems}
      renderItem={renderItem}
      keyExtractor={(item) => item.id || Math.random().toString()}
      contentContainerStyle={[
        styles.gridContainer,
        availableItems.length === 0 && { flex: 1 }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      numColumns={2}
      columnWrapperStyle={availableItems.length > 0 ? styles.columnWrapper : undefined}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={100}
      windowSize={10}
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default MarketplaceList;