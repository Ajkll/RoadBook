import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Input from '../common/Input';
import Button from '../common/Button';

interface MarketplaceHeaderProps {
  searchText: string;
  setSearchText: (text: string) => void;
  onShowAddModal: () => void;
  onShowHistoryModal: () => void;
  currentUser: any;
  stats?: {
    totalItems: number;
    availableItems: number;
    userItems: number;
    userBalance?: {
      balance: number;
      totalEarned: number;
      totalSpent: number;
    };
  };
  onDebugDiagnostic?: () => void;
}

const MarketplaceHeader: React.FC<MarketplaceHeaderProps> = ({
  searchText,
  setSearchText,
  onShowAddModal,
  onShowHistoryModal,
  currentUser,
  stats,
  onDebugDiagnostic
}) => {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.header, { padding: spacing.md }]}>
      {/* Titre et statistiques */}
      <View style={styles.titleSection}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.backgroundText }]}>
            Marketplace
          </Text>
          {onDebugDiagnostic && (
            <TouchableOpacity
              onPress={onDebugDiagnostic}
              style={styles.debugButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="bug-outline" size={20} color={colors.backgroundTextSoft} />
            </TouchableOpacity>
          )}
        </View>

        {stats && (
          <View style={styles.statsContainer}>
            <Text style={[styles.statsText, { color: colors.backgroundTextSoft }]}>
              {stats.availableItems} article{stats.availableItems > 1 ? 's' : ''} disponible{stats.availableItems > 1 ? 's' : ''}
            </Text>
            {currentUser && stats.userBalance && (
              <Text style={[
                styles.balanceText,
                { color: stats.userBalance.balance >= 0 ? colors.success : colors.error }
              ]}>
                Balance: {stats.userBalance.balance >= 0 ? '+' : ''}€{stats.userBalance.balance.toFixed(2)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Barre de recherche */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Rechercher un produit ou vendeur"
          value={searchText}
          onChangeText={setSearchText}
          icon="search"
          style={[styles.searchInput, { backgroundColor: colors.ui.card.background }]}
        />
      </View>

      {/* Boutons d'action */}
      <View style={styles.actionsContainer}>
        <View style={styles.buttonsContainer}>
          <Button
            icon="time-outline"
            label="Historique"
            onPress={onShowHistoryModal}
            type="secondary"
            small
            style={styles.actionButton}
          />

          {currentUser && (
            <Button
              icon="add"
              label="Ajouter"
              onPress={onShowAddModal}
              type="primary"
              small
              style={[styles.actionButton, { marginLeft: spacing.sm }]}
            />
          )}
        </View>

        {/* Informations utilisateur */}
        {currentUser ? (
          <View style={[styles.userInfo, { backgroundColor: colors.ui.card.background }]}>
            <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.userText, { color: colors.backgroundText }]} numberOfLines={1}>
              {currentUser.displayName || currentUser.name || currentUser.email || 'Utilisateur'}
            </Text>
            {stats && stats.userItems > 0 && (
              <View style={[styles.userBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.userBadgeText, { color: colors.primaryText }]}>
                  {stats.userItems}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.loginPrompt, { backgroundColor: colors.ui.card.background }]}>
            <Ionicons name="log-in-outline" size={18} color={colors.backgroundTextSoft} />
            <Text style={[styles.loginText, { color: colors.backgroundTextSoft }]}>
              Connectez-vous pour vendre
            </Text>
          </View>
        )}
      </View>

      {/* Résumé rapide des stats si disponible */}
      {stats && stats.totalItems > 0 && (
        <View style={[styles.quickStats, { backgroundColor: colors.ui.card.background }]}>
          <View style={styles.statItem}>
            <Ionicons name="storefront-outline" size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.backgroundText }]}>
              {stats.availableItems}
            </Text>
            <Text style={[styles.statLabel, { color: colors.backgroundTextSoft }]}>
              disponibles
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Ionicons name="cube-outline" size={16} color={colors.backgroundTextSoft} />
            <Text style={[styles.statValue, { color: colors.backgroundText }]}>
              {stats.totalItems}
            </Text>
            <Text style={[styles.statLabel, { color: colors.backgroundTextSoft }]}>
              total
            </Text>
          </View>

          {currentUser && stats.userItems > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="person-outline" size={16} color={colors.accent} />
                <Text style={[styles.statValue, { color: colors.backgroundText }]}>
                  {stats.userItems}
                </Text>
                <Text style={[styles.statLabel, { color: colors.backgroundTextSoft }]}>
                  mes articles
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 8,
  },
  titleSection: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  debugButton: {
    padding: 4,
    borderRadius: 4,
  },
  statsContainer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statsText: {
    fontSize: 14,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionsContainer: {
    gap: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    minWidth: 100,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  userBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  loginPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  loginText: {
    marginLeft: 6,
    fontSize: 14,
    fontStyle: 'italic',
  },
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
});

export default MarketplaceHeader;