import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, RefreshControl, Alert, Text } from 'react-native';
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

// Import du diagnostic
import { diagnoseMarketplaceData } from './services/firebase/marketplace';

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
    userTransactions,
    loadUserTransactions
  } = useMarketplace();

  // === DIAGNOSTIC AU CHARGEMENT ===
  useEffect(() => {
    if (__DEV__) {
      console.log('🩺 Lancement du diagnostic marketplace...');

      // Diagnostic automatique
      const runDiagnostic = async () => {
        try {
          const stats = await diagnoseMarketplaceData();
          if (stats) {
            console.log('📊 Résultats du diagnostic:', stats);

            // Alerte si des problèmes sont détectés
            if (stats.emptyId > 0 || stats.withoutId > 0) {
              Alert.alert(
                '⚠️ Problème détecté',
                `${stats.emptyId + stats.withoutId} articles ont des IDs manquants. Cela peut causer des problèmes lors des achats.`,
                [
                  { text: 'Ignorer', style: 'cancel' },
                  {
                    text: 'Voir logs',
                    onPress: () => console.log('📋 Consultez les logs pour plus de détails')
                  }
                ]
              );
            }
          }
        } catch (error) {
          console.error('❌ Erreur diagnostic:', error);
        }
      };

      // Lancer le diagnostic après un délai pour laisser le temps aux données de se charger
      setTimeout(runDiagnostic, 2000);
    }
  }, []);

  // === DEBUG DES ITEMS ===
  useEffect(() => {
    if (__DEV__ && items.length > 0) {
      console.log('🔍 Debug des articles chargés dans MarketplaceScreen:');
      items.slice(0, 3).forEach((item, index) => {
        console.log(`Article ${index + 1}:`, {
          id: item.id,
          title: item.title,
          hasId: !!item.id,
          idType: typeof item.id,
          sellerId: item.sellerId,
          price: item.price
        });
      });

      const itemsWithoutId = items.filter(item => !item.id || item.id === '');
      if (itemsWithoutId.length > 0) {
        console.warn('⚠️ Articles sans ID dans MarketplaceScreen:', itemsWithoutId);
      }
    }
  }, [items]);

  // === FONCTION DE NAVIGATION VERS LE PAIEMENT AVEC VALIDATION ===
  const navigateToPayment = useCallback((item) => {
    console.log('🛒 Tentative de navigation vers le paiement:', item);

    // Validation complète avant navigation
    if (!item.id || item.id === '') {
      console.error('❌ Article sans ID:', item);
      Alert.alert(
        'Erreur',
        'Cet article n\'a pas d\'identifiant valide. Impossible de procéder à l\'achat.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!item.sellerId || item.sellerId === '') {
      console.error('❌ Vendeur sans ID:', item);
      Alert.alert(
        'Erreur',
        'Informations du vendeur manquantes.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (!currentUser) {
      Alert.alert(
        'Connexion requise',
        'Vous devez être connecté pour acheter un article.',
        [{ text: 'OK' }]
      );
      return false;
    }

    const userId = currentUser.id || currentUser.uid;
    if (item.sellerId === userId) {
      Alert.alert(
        'Achat impossible',
        'Vous ne pouvez pas acheter votre propre article.',
        [{ text: 'OK' }]
      );
      return false;
    }

    if (item.isSold) {
      Alert.alert(
        'Article indisponible',
        'Cet article a déjà été vendu.',
        [{ text: 'OK' }]
      );
      return false;
    }

    // Validation des données essentielles
    if (!item.title || !item.price || item.price <= 0) {
      console.error('❌ Données article incomplètes:', item);
      Alert.alert(
        'Erreur',
        'Les informations de l\'article sont incomplètes.',
        [{ text: 'OK' }]
      );
      return false;
    }

    try {
      // Préparer les données avec validation
      const productData = {
        id: item.id,
        title: item.title,
        description: item.description || '',
        price: item.price,
        sellerName: item.sellerName,
        sellerId: item.sellerId,
        imageUrl: item.imageUrl || ''
      };

      console.log('✅ Navigation vers le paiement avec données validées:', {
        productId: productData.id,
        sellerId: productData.sellerId,
        title: productData.title,
        price: productData.price
      });

      router.push({
        pathname: '/payment',
        params: {
          product: JSON.stringify(productData),
          sellerId: item.sellerId,
          itemId: item.id,
          // Paramètres de backup au cas où
          backupItemId: item.id,
          sellerName: item.sellerName,
          itemTitle: item.title,
          itemPrice: item.price.toString()
        }
      });

      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la navigation:', error);
      Alert.alert(
        'Erreur',
        'Impossible de naviguer vers le paiement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }, [currentUser, router]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleAddModalOpen = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const handleAddModalClose = useCallback(() => {
    setShowAddModal(false);
  }, []);

  const handleHistoryModalOpen = useCallback(async () => {
    try {
      await loadUserTransactions();
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Error loading user transactions:', error);
      Alert.alert(
        'Erreur',
        'Impossible de charger l\'historique des transactions.',
        [{ text: 'OK' }]
      );
    }
  }, [loadUserTransactions]);

  const handleHistoryModalClose = useCallback(() => {
    setShowHistoryModal(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadItems();
    } catch (error) {
      console.error('Error refreshing items:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadItems]);

  const handleAddItem = useCallback(async (item, imageUri) => {
    try {
      const success = await addItem(item, imageUri);
      if (success) {
        // Refresh the list after adding an item
        await loadItems();
      }
      return success;
    } catch (error) {
      console.error('Error adding item:', error);
      return false;
    }
  }, [addItem, loadItems]);

  const handleDeleteItem = useCallback(async (itemId) => {
    try {
      if (!itemId || itemId === '') {
        console.error('❌ Tentative de suppression avec ID manquant');
        Alert.alert(
          'Erreur',
          'Impossible de supprimer cet article (ID manquant).',
          [{ text: 'OK' }]
        );
        return;
      }

      Alert.alert(
        'Confirmer la suppression',
        'Êtes-vous sûr de vouloir supprimer cet article ?',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteItem(itemId);
                // Refresh the list after deleting an item
                await loadItems();
              } catch (error) {
                console.error('Error deleting item:', error);
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
      console.error('Error in handleDeleteItem:', error);
    }
  }, [deleteItem, loadItems]);

  // Memoized computed values
  const itemsCount = useMemo(() => filteredItems.length, [filteredItems]);
  const userItemsCount = useMemo(() =>
    items.filter(item => item.sellerId === (currentUser?.id || currentUser?.uid)).length,
    [items, currentUser]
  );

  // === FONCTION DE TEST MANUEL ===
  const runManualDiagnostic = useCallback(async () => {
    try {
      console.log('🔧 Diagnostic manuel lancé...');
      const stats = await diagnoseMarketplaceData();

      if (stats) {
        const message = `
📊 Résultats du diagnostic:
• Articles avec ID: ${stats.withId}
• Articles sans ID: ${stats.withoutId}
• ID vides: ${stats.emptyId}
• ID null: ${stats.nullId}
• ID undefined: ${stats.undefinedId}

Total: ${stats.withId + stats.withoutId + stats.emptyId + stats.nullId + stats.undefinedId} articles
        `;

        Alert.alert('Diagnostic Marketplace', message, [{ text: 'OK' }]);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exécuter le diagnostic');
    }
  }, []);

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
          itemsCount={itemsCount}
          userItemsCount={userItemsCount}
          // Ajout du diagnostic manuel en mode dev
          onDebugDiagnostic={__DEV__ ? runManualDiagnostic : undefined}
        />

        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
          </View>
        ) : (
          <MarketplaceList
            items={filteredItems}
            currentUser={currentUser}
            loading={isLoading}
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            onDeleteItem={handleDeleteItem}
            onBuyItem={navigateToPayment} // Fonction de navigation personnalisée
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
        />

        <GoBackHomeButton
          containerStyle={styles.backButton}
        />

        {/* Debug info en bas de l'écran en mode développement */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Debug: {items.length} articles | {items.filter(i => !i.id || i.id === '').length} sans ID
            </Text>
          </View>
        )}
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
  backButton: {
    marginVertical: 20,
    alignSelf: 'center',
  },
  backButtonOffline: {
    alignSelf: 'flex-start',
    margin: 20,
  },
  debugContainer: {
    position: 'absolute',
    bottom: 80,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 4,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});

export default MarketplaceScreen;