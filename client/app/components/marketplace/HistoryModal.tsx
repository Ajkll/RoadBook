import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform
} from 'react-native';
import { useTheme } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceItem, Purchase } from '../../services/firebase/marketplace';

interface HistoryModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: any;
  transactions: Array<Purchase | MarketplaceItem>;
  userBalance?: {
    totalEarned: number;
    totalSpent: number;
    balance: number;
    totalSales: number;
    totalPurchases: number;
    activeListing: number;
    deletedItems: number;
  };
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  visible,
  onClose,
  currentUser,
  transactions,
  userBalance
}) => {
  const { colors, spacing } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Debug des transactions reçues
  useEffect(() => {
    if (visible) {
      console.log('📊 HistoryModal ouvert avec:');
      console.log('👤 CurrentUser:', currentUser?.id || currentUser?.uid);
      console.log('📋 Transactions:', transactions?.length || 0);
      console.log('💰 Balance:', userBalance);

      if (transactions && transactions.length > 0) {
        console.log('📈 Types de transactions:');
        transactions.forEach((item, index) => {
          const isPurchase = 'buyerId' in item;
          const isDeleted = !isPurchase && (item as MarketplaceItem).isDeleted;
          const isSold = !isPurchase && (item as MarketplaceItem).isSold;

          let title = '';
          let price = 0;

          if (isPurchase) {
            const purchase = item as Purchase;
            title = purchase.itemData?.title || 'Article inconnu';
            price = purchase.price || purchase.itemData?.price || 0;
          } else {
            const marketItem = item as MarketplaceItem;
            title = marketItem.title || 'Article sans titre';
            price = marketItem.price || 0;
          }

          console.log(`  ${index + 1}: ${
            isPurchase ? 'Achat' :
            isDeleted ? 'Article supprimé' :
            isSold ? 'Vente réalisée' : 'Article en vente'
          } - ${title} (€${price})`);
        });
      }
    }
  }, [visible, currentUser, transactions, userBalance]);

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleBackdropPress = useCallback(() => {
    console.log('❌ Fermeture HistoryModal via backdrop');
    onClose();
  }, [onClose]);

  const renderTransactionItem = useCallback((item: Purchase | MarketplaceItem, index: number) => {
    try {
      const isPurchase = 'buyerId' in item;

      // Gestion sécurisée des dates
      let date: Date;
      if (isPurchase) {
        const purchase = item as Purchase;
        date = purchase.purchaseDate instanceof Date
          ? purchase.purchaseDate
          : new Date(purchase.purchaseDate);
      } else {
        const marketItem = item as MarketplaceItem;
        // Utiliser la date de vente, suppression, ou création selon le cas
        if (marketItem.purchaseDate) {
          date = marketItem.purchaseDate instanceof Date
            ? marketItem.purchaseDate
            : new Date(marketItem.purchaseDate);
        } else if (marketItem.deletedAt) {
          date = marketItem.deletedAt instanceof Date
            ? marketItem.deletedAt
            : new Date(marketItem.deletedAt);
        } else {
          date = marketItem.createdAt instanceof Date
            ? marketItem.createdAt
            : new Date(marketItem.createdAt);
        }
      }

      const title = isPurchase
        ? (item as Purchase).itemData?.title || 'Article inconnu'
        : (item as MarketplaceItem).title || 'Article sans titre';

      const amount = isPurchase
        ? (item as Purchase).price || (item as Purchase).itemData?.price || 0
        : (item as MarketplaceItem).price || 0;

      // Logique améliorée pour déterminer le type et statut
      let otherParty = '';
      let transactionType = '';
      let statusColor = colors.backgroundTextSoft;
      let icon = 'help-outline';

      if (isPurchase) {
        transactionType = 'Achat';
        otherParty = (item as Purchase).itemData?.sellerName || 'Vendeur inconnu';
        statusColor = colors.error; // Rouge pour les achats (sortie d'argent)
        icon = 'arrow-down-outline';
      } else {
        const marketItem = item as MarketplaceItem;
        if (marketItem.isDeleted) {
          transactionType = 'Supprimé';
          otherParty = 'Article retiré de la vente';
          statusColor = colors.backgroundTextSoft; // Gris pour les supprimés
          icon = 'trash-outline';
        } else if (marketItem.isSold) {
          transactionType = 'Vendu';
          otherParty = marketItem.buyerName || 'Article vendu';
          statusColor = colors.success; // Vert pour les ventes (entrée d'argent)
          icon = 'arrow-up-outline';
        } else {
          transactionType = 'En vente';
          otherParty = 'Article disponible';
          statusColor = colors.primary; // Bleu pour les articles en vente
          icon = 'storefront-outline';
        }
      }

      return (
        <View
          key={`${isPurchase ? 'purchase' : 'sale'}-${item.id || index}`}
          style={[
            styles.transactionItem,
            {
              backgroundColor: colors.ui.card.background,
              marginBottom: spacing.sm,
              padding: spacing.md,
              borderRadius: 12,
              borderLeftWidth: 4,
              borderLeftColor: statusColor,
            }
          ]}
        >
          <View style={styles.transactionHeader}>
            <Text
              style={[styles.transactionTitle, { color: colors.backgroundText }]}
              numberOfLines={2}
            >
              {title}
            </Text>
            <View style={styles.amountContainer}>
              <Text style={[styles.transactionAmount, { color: statusColor }]}>
                {isPurchase
                  ? `-€${amount.toFixed(2)}`
                  : (item as MarketplaceItem).isSold
                    ? `+€${amount.toFixed(2)}`
                    : `€${amount.toFixed(2)}`
                }
              </Text>
            </View>
          </View>

          <View style={styles.transactionMeta}>
            <View style={styles.transactionTypeContainer}>
              <Ionicons
                name={icon as any}
                size={16}
                color={statusColor}
              />
              <Text style={[styles.transactionType, { color: statusColor }]}>
                {transactionType}
              </Text>
            </View>
            <Text style={[styles.otherParty, { color: colors.backgroundTextSoft }]}>
              {otherParty}
            </Text>
          </View>

          <Text style={[styles.transactionDate, { color: colors.backgroundTextSoft }]}>
            {date.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>

          {/* Statut additionnel pour les articles supprimés */}
          {!isPurchase && (item as MarketplaceItem).isDeleted && (
            <View style={[styles.statusBadge, { backgroundColor: colors.backgroundTextSoft }]}>
              <Text style={[styles.statusText, { color: colors.background }]}>
                Retiré de la vente
              </Text>
            </View>
          )}

          {/* Debug info en mode développement */}
          {__DEV__ && (
            <Text style={[styles.debugInfo, { color: colors.backgroundTextSoft }]}>
              Debug: {isPurchase ? 'Achat' : 'Vente'} | ID: {item.id || 'N/A'} |
              {!isPurchase && ` Sold: ${(item as MarketplaceItem).isSold} | Deleted: ${(item as MarketplaceItem).isDeleted}`}
            </Text>
          )}
        </View>
      );
    } catch (error) {
      console.error('❌ Erreur rendu transaction:', error, item);
      return (
        <View key={`error-${index}`} style={[styles.errorItem, { backgroundColor: colors.ui.card.background }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>
            Erreur d'affichage de la transaction
          </Text>
        </View>
      );
    }
  }, [colors, spacing]);

  if (!visible) return null;

  // Utiliser userBalance si disponible, sinon calculer à partir des transactions
  const balance = userBalance || {
    totalEarned: 0,
    totalSpent: 0,
    balance: 0,
    totalSales: 0,
    totalPurchases: 0,
    activeListing: 0,
    deletedItems: 0
  };

  // Si pas de userBalance, calculer à partir des transactions
  if (!userBalance && transactions) {
    transactions.forEach(item => {
      const isPurchase = 'buyerId' in item;
      const amount = isPurchase
        ? (item as Purchase).itemData?.price || (item as Purchase).price || 0
        : (item as MarketplaceItem).price;

      if (isPurchase) {
        balance.totalSpent += amount;
        balance.totalPurchases += 1;
      } else {
        const marketItem = item as MarketplaceItem;
        if (marketItem.isSold) {
          balance.totalEarned += amount;
          balance.totalSales += 1;
        } else if (marketItem.isDeleted) {
          balance.deletedItems += 1;
        } else {
          balance.activeListing += 1;
        }
      }
    });

    balance.balance = balance.totalEarned - balance.totalSpent;
  }

  const totalTransactions = transactions?.length || 0;

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }} />
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.modalContainer,
          {
            backgroundColor: colors.background,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <View style={[styles.modalHeader, { padding: spacing.md, borderBottomColor: colors.ui.card.border }]}>
          <View>
            <Text style={[styles.modalTitle, { color: colors.backgroundText }]}>
              Historique des transactions
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.backgroundTextSoft }]}>
              {totalTransactions} transaction{totalTransactions > 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.backgroundText} />
          </TouchableOpacity>
        </View>

        {/* Debug info en mode développement */}
        {__DEV__ && (
          <View style={[styles.debugContainer, { backgroundColor: colors.ui.card.background, margin: spacing.md }]}>
            <Text style={[styles.debugTitle, { color: colors.backgroundText }]}>
              🔍 Debug Info:
            </Text>
            <Text style={[styles.debugText, { color: colors.backgroundTextSoft }]}>
              User: {currentUser?.id || currentUser?.uid || 'Non connecté'}
            </Text>
            <Text style={[styles.debugText, { color: colors.backgroundTextSoft }]}>
              Total transactions: {totalTransactions}
            </Text>
            <Text style={[styles.debugText, { color: colors.backgroundTextSoft }]}>
              Balance calculée: {balance.balance.toFixed(2)}€
            </Text>
          </View>
        )}

        {/* Résumé financier amélioré */}
        {totalTransactions > 0 && (
          <View style={[styles.summaryContainer, { padding: spacing.md, backgroundColor: colors.ui.card.background }]}>
            {/* Balance principale */}
            <View style={[styles.mainBalanceContainer, { marginBottom: spacing.md }]}>
              <Text style={[styles.balanceLabel, { color: colors.backgroundTextSoft }]}>
                Balance totale
              </Text>
              <Text style={[
                styles.mainBalance,
                { color: balance.balance >= 0 ? colors.success : colors.error }
              ]}>
                {balance.balance >= 0 ? '+' : ''}€{balance.balance.toFixed(2)}
              </Text>
            </View>

            {/* Détails financiers */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  Gains totaux
                </Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  +€{balance.totalEarned.toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  Dépenses totales
                </Text>
                <Text style={[styles.summaryValue, { color: colors.error }]}>
                  -€{balance.totalSpent.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Statistiques d'activité */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  Articles vendus
                </Text>
                <Text style={[styles.summaryValue, { color: colors.backgroundText }]}>
                  {balance.totalSales}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  Articles achetés
                </Text>
                <Text style={[styles.summaryValue, { color: colors.backgroundText }]}>
                  {balance.totalPurchases}
                </Text>
              </View>
            </View>

            {/* Statut des annonces */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  En vente
                </Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>
                  {balance.activeListing}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.backgroundTextSoft }]}>
                  Supprimés
                </Text>
                <Text style={[styles.summaryValue, { color: colors.backgroundTextSoft }]}>
                  {balance.deletedItems}
                </Text>
              </View>
            </View>
          </View>
        )}

        <ScrollView
          style={{ padding: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          {!transactions || transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={colors.backgroundTextSoft}
              />
              <Text style={[styles.emptyTitle, { color: colors.backgroundText }]}>
                Aucune transaction
              </Text>
              <Text style={[styles.emptyText, { color: colors.backgroundTextSoft }]}>
                Vos achats et ventes apparaîtront ici
              </Text>
              {__DEV__ && (
                <Text style={[styles.debugText, { color: colors.backgroundTextSoft, marginTop: 16 }]}>
                  Debug: transactions = {transactions ? 'array vide' : 'null/undefined'}
                </Text>
              )}
            </View>
          ) : (
            transactions.map(renderTransactionItem)
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    elevation: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    marginTop: '20%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  debugContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  debugInfo: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  summaryContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  mainBalanceContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  mainBalance: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionItem: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  errorItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ff0000',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  otherParty: {
    fontSize: 14,
  },
  transactionDate: {
    fontSize: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default HistoryModal;