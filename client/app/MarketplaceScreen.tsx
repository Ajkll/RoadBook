import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Alert, Text } from 'react-native';
import { useTheme } from './constants/theme';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from './store/slices/networkSlice';
import { useMarketplace } from './hooks/useMarketplace';
import { useRouter } from 'expo-router';
import OfflineContent from './components/ui/OfflineContent';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import MarketplaceHeader from './components/marketplace/MarketplaceHeader';
import MarketplaceList from './components/marketplace/MarketplaceList';
import AddItemModal from './components/marketplace/AddItemModal';
import HistoryModal from './components/marketplace/HistoryModal';
import Toast from 'react-native-toast-message';

const MarketplaceScreen = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const isConnected = useSelector(selectIsInternetReachable);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    items,
    filteredItems,
    searchText,
    setSearchText,
    currentUser,
    isLoading,
    isUploading,
    loadItems,
    addItem,
    deleteItem,
    buyItem,
    userTransactions,
    userBalance,
    loadUserTransactions,
    stats
  } = useMarketplace();

  const handleBuyItem = useCallback((itemId: string) => {
    if (!itemId || itemId === '') {
      Alert.alert(
        'Erreur',
        'Cet article n\'a pas d\'identifiant valide.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!currentUser) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour acheter un article.',
        [{ text: 'OK' }]
      );
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (!item) {
      Alert.alert(
        'Article introuvable',
        'Cet article n\'existe plus.',
        [{ text: 'OK' }]
      );
      return;
    }

    const userId = currentUser.id || currentUser.uid;
    if (item.sellerId === userId) {
      Alert.alert(
        'Achat impossible',
        'Vous ne pouvez pas acheter votre propre article.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (item.isSold) {
      Alert.alert(
        'Article indisponible',
        'Cet article a déjà été vendu.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (item.isDeleted) {
      Alert.alert(
        'Article indisponible',
        'Cet article a été retiré de la vente.',
        [{ text: 'OK' }]
      );
      return;
    }

    const productData = {
      id: item.id,
      title: item.title,
      description: item.description || '',
      price: item.price,
      sellerName: item.sellerName,
      sellerId: item.sellerId,
      imageUrl: item.imageUrl || ''
    };

    try {
      router.push({
        pathname: '/PaymentScreen',
        params: {
          product: JSON.stringify(productData),
          sellerId: item.sellerId,
          itemId: item.id,
          backupItemId: item.id,
          sellerName: item.sellerName,
          itemTitle: item.title,
          itemPrice: item.price.toString()
        }
      });
    } catch (error) {
      Alert.alert(
        'Erreur de navigation',
        'Impossible d\'ouvrir l\'écran de paiement.',
        [{ text: 'OK' }]
      );
    }
  }, [items, currentUser, router]);

  const handleAddModalOpen = useCallback(() => {
    if (!currentUser) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour ajouter un article.',
        [{ text: 'OK' }]
      );
      return;
    }
    setShowAddModal(true);
  }, [currentUser]);

  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleHistoryModalOpen = useCallback(async () => {
    if (!currentUser) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour voir votre historique.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      await loadUserTransactions();
      setShowHistoryModal(true);
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible de charger l\'historique des transactions.',
        [{ text: 'OK' }]
      );
    }
  }, [currentUser, loadUserTransactions]);

  const handleHistoryModalClose = useCallback(() => {
    setShowHistoryModal(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadItems();
      if (currentUser) {
        await loadUserTransactions();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de rafraîchir les données',
        position: 'bottom'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [loadItems, loadUserTransactions, currentUser]);

  const handleAddItem = useCallback(async (item, imageUri) => {
    try {
      const success = await addItem(item, imageUri);
      return success;
    } catch (error) {
      return false;
    }
  }, [addItem]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    try {
      if (!itemId || itemId === '') {
        Alert.alert(
          'Erreur',
          'Impossible de supprimer cet article (ID manquant).',
          [{ text: 'OK' }]
        );
        return;
      }

      const item = items.find(i => i.id === itemId);
      const itemName = item ? item.title : 'cet article';

      Alert.alert(
        'Confirmer la suppression',
        `Êtes-vous sûr de vouloir retirer "${itemName}" de la vente ? L'article restera dans votre historique.`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                const success = await deleteItem(itemId);
                if (success) {
                  Toast.show({
                    type: 'success',
                    text1: 'Article supprimé',
                    text2: 'L\'article a été retiré de la vente',
                    position: 'bottom'
                  });
                }
              } catch (error) {
                Alert.alert(
                  'Erreur',
                  'Impossible de supprimer l\'article.',
                  [{ text: 'OK' }]
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      // Handle error silently
    }
  }, [items, deleteItem]);

  if (!isConnected) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <OfflineContent message="Aucune connexion Internet disponible" />
        <GoBackHomeButton
          containerStyle={styles.backButtonOffline}
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <MarketplaceHeader
          searchText={searchText}
          setSearchText={setSearchText}
          onShowAddModal={handleAddModalOpen}
          onShowHistoryModal={handleHistoryModalOpen}
          currentUser={currentUser}
          stats={{
            totalItems: stats.totalItems,
            availableItems: stats.availableItems,
            userItems: stats.userItems,
            userBalance: userBalance
          }}
        />

        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <Text style={[styles.loadingText, { color: colors.backgroundTextSoft }]}>
              Chargement des articles...
            </Text>
          </View>
        ) : (
          <MarketplaceList
            items={filteredItems}
            currentUser={currentUser}
            loading={isLoading}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            onDeleteItem={handleDeleteItem}
            onBuyItem={handleBuyItem}
          />
        )}

        <AddItemModal
          visible={showAddModal}
          onClose={handleAddModalClose}
          currentUser={currentUser}
          onSubmit={handleAddItem}
          isUploading={isUploading}
        />

        <HistoryModal
          visible={showHistoryModal}
          onClose={handleHistoryModalClose}
          currentUser={currentUser}
          transactions={userTransactions || []}
          userBalance={userBalance}
        />

        <GoBackHomeButton
          containerStyle={styles.backButton}
        />
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  backButton: {
    marginVertical: 20,
    alignSelf: 'center',
  },
  backButtonOffline: {
    alignSelf: 'flex-start',
    margin: 20,
  },
});

export default MarketplaceScreen;