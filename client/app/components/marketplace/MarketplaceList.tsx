import React from 'react';
import { FlatList, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../constants/theme';
import MarketplaceItemCard from './MarketplaceItemCard';
import { Ionicons } from '@expo/vector-icons';

interface MarketplaceListProps {
  items: MarketplaceItem[];
  currentUser: any;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onDeleteItem: (itemId: string) => void;
}

const MarketplaceList: React.FC<MarketplaceListProps> = ({
  items,
  currentUser,
  loading,
  onRefresh,
  onDeleteItem
}) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <MarketplaceItemCard
          item={item}
          currentUser={currentUser}
          onDeleteItem={onDeleteItem}
        />
      )}
      keyExtractor={item => item.id}
      contentContainerStyle={[
        styles.gridContainer,
        items.length === 0 && { flex: 1 } // Prend toute la hauteur si vide
      ]}
      refreshing={refreshing}
      onRefresh={handleRefresh}
      numColumns={2}
      columnWrapperStyle={styles.columnWrapper}
      ListEmptyComponent={
        loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.backgroundTextSoft} />
            <Text style={[styles.emptyText, { color: colors.backgroundTextSoft }]}>
              Aucun article trouvé
            </Text>
          </View>
        )
      }
      ListFooterComponent={
        items.length > 0 && loading ? (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    padding: 8,
    minHeight: '100%' // Garantit que le contenu prend toute la hauteur
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12 // Espacement entre les colonnes
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center'
  }
});

export default MarketplaceList;