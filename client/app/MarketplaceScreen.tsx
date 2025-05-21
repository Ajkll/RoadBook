import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native'; // Ajout de ActivityIndicator ici
import { useTheme } from './constants/theme';
import { useSelector } from 'react-redux';
import { selectIsInternetReachable } from './store/slices/networkSlice';
import { useMarketplace } from './hooks/useMarketplace';
import OfflineContent from './components/ui/OfflineContent';
import GoBackHomeButton from './components/common/GoBackHomeButton';
import MarketplaceHeader from './components/marketplace/MarketplaceHeader';
import MarketplaceList from './components/marketplace/MarketplaceList';
import AddItemModal from './components/marketplace/AddItemModal';
import HistoryModal from './components/marketplace/HistoryModal';

const MarketplaceScreen = () => {
  const { colors } = useTheme();
  const isConnected = useSelector(selectIsInternetReachable);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

  if (!isConnected) {
    return (
      <SafeAreaView style={styles.container}>
        <OfflineContent message="Aucune connexion Internet" />
        <GoBackHomeButton containerStyle={{ alignSelf: 'flex-start' }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MarketplaceHeader
        searchText={searchText}
        setSearchText={setSearchText}
        onShowAddModal={() => setShowAddModal(true)}
        onShowHistoryModal={() => {
          loadUserTransactions();
          setShowHistoryModal(true);
        }}
        currentUser={currentUser}
      />

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      ) : (
        <MarketplaceList
          items={filteredItems}
          currentUser={currentUser}
          loading={isLoading}
          onRefresh={loadItems}
          onDeleteItem={deleteItem}
        />
      )}

      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        currentUser={currentUser}
        onSubmit={addItem}
        isUploading={isUploading}
      />

      <HistoryModal
        visible={showHistoryModal}
        setVisible={setShowHistoryModal}
        currentUser={currentUser}
        items={items}
      />

      <GoBackHomeButton containerStyle={{ marginVertical: 20 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default MarketplaceScreen;