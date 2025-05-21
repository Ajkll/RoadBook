import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Input from '../common/Input'; // Import direct
import Button from '../common/Button'; // Import direct

interface MarketplaceHeaderProps {
  searchText: string;
  setSearchText: (text: string) => void;
  onShowAddModal: () => void;
  onShowHistoryModal: () => void;
  currentUser: any;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  searchText,
  setSearchText,
  onShowAddModal,
  onShowHistoryModal,
  currentUser
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.header, { padding: spacing.md }]}>
      <View style={styles.searchContainer}>
        <Input
          placeholder="Rechercher un produit"
          value={searchText}
          onChangeText={setSearchText}
          icon="search"
        />
      </View>

      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.backgroundText }]}>Marketplace</Text>
        <View style={styles.buttonsContainer}>
          <Button
            icon="time-outline"
            label="Historique"
            onPress={onShowHistoryModal}
            type="secondary"
            small
          />

          {currentUser && (
            <Button
              icon="add"
              label="Ajouter"
              onPress={onShowAddModal}
              type="primary"
              small
              style={{ marginLeft: spacing.sm }}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 8
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  searchContainer: {
    marginBottom: 8
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  buttonsContainer: {
    flexDirection: 'row'
  }
});

export default MarketplaceHeader;