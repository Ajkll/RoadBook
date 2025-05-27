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
    navigateToPayment, // Fonction de navigation vers le paiement
    userTransactions,
    userBalance,
    loadUserTransactions,
    stats
  } = useMarketplace();

  // === DIAGNOSTIC AU CHARGEMENT ===
  useEffect(() => {
    if (__DEV__) {
      console.log('🩺 Lancement du diagnostic marketplace...');

      const runDiagnostic = async () => {
        try {
          const diagnosticStats = await diagnoseMarketplaceData();
          if (diagnosticStats) {
            console.log('📊 Résultats du diagnostic:', diagnosticStats);

            if (diagnosticStats.withoutId > 0 || diagnosticStats.emptyId > 0) {
              Alert.alert(
                '⚠️ Problème détecté',
                `${diagnosticStats.withoutId + diagnosticStats.emptyId} articles ont des IDs manquants.`,
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

      setTimeout(runDiagnostic, 2000);
    }
  }, []);

  // === DEBUG DES ITEMS ===
  useEffect(() => {
    if (__DEV__ && items.length > 0) {
      console.log('🔍 Debug des articles chargés dans MarketplaceScreen:');
      console.log(`📦 Total: ${items.length} articles`);
      console.log(`✅ Disponibles: ${stats.availableItems} articles`);
      console.log(`👤 Mes articles: ${stats.userItems} articles`);

      const itemsWithoutId = items.filter(item => !item.id || item.id === '');
      if (itemsWithoutId.length > 0) {
        console.warn('⚠️ Articles sans ID:', itemsWithoutId);
      }
    }
  }, [items, stats]);

  // === FONCTION DE NAVIGATION VERS LE PAIEMENT ===
  const handleBuyItem = useCallback((itemId: string) => {
    console.log('🛒 Tentative de navigation vers le paiement:', itemId);

    if (!itemId || itemId === '') {
      console.error('❌ Article sans ID:', itemId);
      Alert.alert(
        'Erreur',
        'Cet article n\'a pas d\'identifiant valide.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Trouver l'article dans la liste
    const item = items.find(i => i.id === itemId);
    if (!item) {
      Alert.alert(
        'Article introuvable',
        'Cet article n\'existe plus.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Utiliser la fonction de navigation du hook
    const success = navigateToPayment(item);
    if (success) {
      console.log('✅ Navigation vers le paiement réussie');
    } else {
      console.log('❌ Échec de la navigation vers le paiement');
    }
  }, [items, navigateToPayment]);

  // Handlers pour les modals
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
      console.log('📊 Ouverture historique...');
      await loadUserTransactions();
      setShowHistoryModal(true);
    } catch (error) {
      console.error('❌ Error loading user transactions:', error);
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
    console.log('🔄 Rafraîchissement des données...');
    setIsRefreshing(true);
    try {
      await loadItems();
      if (currentUser) {
        await loadUserTransactions();
      }
    } catch (error) {
      console.error('❌ Error refreshing items:', error);
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
      console.log('➕ Ajout nouvel article...');
      const success = await addItem(item, imageUri);
      if (success) {
        console.log('✅ Article ajouté avec succès');
        // La liste sera automatiquement rechargée par le hook
      }
      return success;
    } catch (error) {
      console.error('❌ Error adding item:', error);
      return false;
    }
  }, [addItem]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
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

      // Trouver l'article pour afficher son nom
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
                console.log('🗑️ Suppression article:', itemId);
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
                console.error('❌ Error deleting item:', error);
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
      console.error('❌ Error in handleDeleteItem:', error);
    }
  }, [items, deleteItem]);

  // === FONCTION DE TEST MANUEL ===
  const runManualDiagnostic = useCallback(async () => {
    try {
      console.log('🔧 Diagnostic manuel lancé...');
      const diagnosticStats = await diagnoseMarketplaceData();

      if (diagnosticStats) {
        const message = `
📊 Diagnostic Marketplace:
• Articles actifs: ${diagnosticStats.active}
• Articles vendus: ${diagnosticStats.sold}
• Articles supprimés: ${diagnosticStats.deleted}

🔍 Analyse des IDs:
• Avec ID valide: ${diagnosticStats.withId}
• Sans ID: ${diagnosticStats.withoutId}
• ID vides: ${diagnosticStats.emptyId}

Total: ${diagnosticStats.withId + diagnosticStats.withoutId + diagnosticStats.emptyId} articles
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
          // Statistiques supplémentaires
          stats={{
            totalItems: stats.totalItems,
            availableItems: stats.availableItems,
            userItems: stats.userItems,
            userBalance: userBalance
          }}
          // Debug en mode développement
          onDebugDiagnostic={__DEV__ ? runManualDiagnostic : undefined}
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
            onBuyItem={handleBuyItem} // Fonction d'achat
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
          userBalance={userBalance} // Passer les données de balance
        />

        <GoBackHomeButton
          containerStyle={styles.backButton}
        />

        {/* Debug info en bas de l'écran en mode développement */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugText}>
              Debug: {stats.totalItems} total | {stats.availableItems} dispo | Balance: €{userBalance.balance.toFixed(2)}
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